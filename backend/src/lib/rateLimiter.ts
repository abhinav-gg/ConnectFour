// backend/src/lib/rateLimiter.ts
// Centralized Redis-backed rate limiter (token bucket + optional block key)
// NOTE: This file is provided for review; not yet wired into routers.

/*
  Design:
  - Token bucket per (IP, group) key: rl:{group}:{ip}
  - Lua script performs atomic refill + consume.
  - Optional immediate block key when exhausted repeatedly: rlblk:{group}:{ip}
  - Configurable groups with differing capacities / refill rates / costs.
  - Supports secondary user-based limiting (after authentication) via identity callback.
  - Fail-open on Redis errors (logs once per cooldown window).
  - Adds headers:
      X-RateLimit-Limit
      X-RateLimit-Remaining
      X-RateLimit-Reset (unix seconds estimate)
      Retry-After (when blocked)
      X-RateLimit-Reason (debug reason on block)
*/

import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@/redis/redisClient';
import crypto from 'crypto';

export interface RateLimitConfig {
  intervalMs: number;     // Refill interval granularity
  capacity: number;       // Max tokens in bucket
  refill: number;         // Tokens added per interval
  cost?: number;          // Tokens consumed per request (default 1)
  blockAfterDeplete?: number; // Optional: number of consecutive depletions before temp block
  blockDurationSec?: number;  // Block TTL when threshold hit
  userCapacity?: number;      // (Optional) secondary per-user capacity
  userRefill?: number;        // (Optional) per-user refill tokens per interval
  userIntervalMs?: number;    // (Optional) per-user interval
}

type GroupMap = Record<string, RateLimitConfig>;

const GROUPS: GroupMap = {
  'auth-login': {
    intervalMs: 1000,
    capacity: 20,
    refill: 1,
    cost: 1,
    blockAfterDeplete: 5,
    blockDurationSec: 60,
  },
  'auth-register': {
    intervalMs: 1000,
    capacity: 10,
    refill: 1,
    cost: 1,
    blockAfterDeplete: 4,
    blockDurationSec: 120,
  },
  'auth-verify-email': {
    intervalMs: 1000,
    capacity: 15,
    refill: 1,
    cost: 1,
    blockAfterDeplete: 6,
    blockDurationSec: 120,
  },
  'default': {
    intervalMs: 1000,
    capacity: 100,
    refill: 10,
    cost: 1,
    blockAfterDeplete: 20,
    blockDurationSec: 60,
  }
};

// Lua Token Bucket Script
// KEYS[1] = bucket key
// KEYS[2] = (optional) consecutive depletion counter key
// ARGV:
// 1 now(ms)
// 2 intervalMs
// 3 capacity
// 4 refill (tokens per interval)
// 5 cost
// 6 blockThreshold (0 disables)
// 7 blockDurationSec
// Returns:
// { allowed(0/1), tokensAfter, nextRefillTs(ms), depletions, blocked(0/1) }
const LUA_TOKEN_BUCKET = `
local bucketKey = KEYS[1]
local depleteKey = KEYS[2]
local now = tonumber(ARGV[1])
local interval = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local refill = tonumber(ARGV[4])
local cost = tonumber(ARGV[5])
local blockThreshold = tonumber(ARGV[6])
local blockDurationSec = tonumber(ARGV[7])

-- Bucket fields: tokens, ts
local data = redis.call('HMGET', bucketKey, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if not tokens or not ts then
  tokens = capacity
  ts = now
else
  if now > ts then
    local intervals = math.floor((now - ts) / interval)
    if intervals > 0 then
      tokens = math.min(capacity, tokens + intervals * refill)
      ts = ts + intervals * interval
    end
  end
end

-- Check block status
local blocked = 0
if blockThreshold > 0 then
  local ttl = redis.call('TTL', depleteKey .. ':blk')
  if ttl and ttl > 0 then
    blocked = 1
  end
end

if blocked == 1 then
  return {0, tokens, ts, -1, 1}
end

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
  -- reset depletion counter on success
  if blockThreshold > 0 then
    redis.call('DEL', depleteKey)
  end
else
  -- increment consecutive depletion counter
  if blockThreshold > 0 then
    local d = redis.call('INCR', depleteKey)
    redis.call('EXPIRE', depleteKey, blockDurationSec)
    if d >= blockThreshold then
      -- set block marker
      redis.call('SETEX', depleteKey .. ':blk', blockDurationSec, '1')
      blocked = 1
    end
    return {0, tokens, ts, d, blocked}
  end
  return {0, tokens, ts, 1, 0}
end

redis.call('HMSET', bucketKey, 'tokens', tokens, 'ts', ts)
-- Set bucket TTL generously (capacity/refill intervals + 2 intervals)
local ttl = math.ceil(((capacity / refill) + 2) * interval / 1000)
redis.call('EXPIRE', bucketKey, ttl)

return {allowed, tokens, ts, 0, 0}
`;

interface ScriptState {
  sha?: string;
  loaded: boolean;
}

const scriptState: ScriptState = { loaded: false };
let lastLogErrorHash: string | null = null;
let lastLogTime = 0;
const LOG_COOLDOWN_MS = 15_000;

function logOnce(err: unknown) {
  try {
    const msg = typeof err === 'string' ? err : (err as any)?.message || JSON.stringify(err);
    const hash = crypto.createHash('sha256').update(msg).digest('hex');
    const now = Date.now();
    if (hash !== lastLogErrorHash || now - lastLogTime > LOG_COOLDOWN_MS) {
      // eslint-disable-next-line no-console
      console.warn('[RateLimiter] Redis/Lua issue (fail-open):', msg);
      lastLogErrorHash = hash;
      lastLogTime = now;
    }
  } catch {
    // ignore
  }
}

async function ensureScript() {
  if (scriptState.loaded && scriptState.sha) return;
  const redis = await getRedisClient();
  scriptState.sha = await redis.script('LOAD', LUA_TOKEN_BUCKET) as string;
  scriptState.loaded = true;
}

function normalizeIp(ipRaw: string | undefined): string {
  if (!ipRaw) return 'unknown';
  // Strip IPv6 prefix / ::ffff:
  return ipRaw.replace(/^::ffff:/, '').toLowerCase();
}

function estimateResetTs(nowMs: number, intervalMs: number): number {
  return Math.floor((nowMs + intervalMs) / 1000); // rough next refill second
}

interface ConsumeResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  blocked: boolean;
  reason?: string;
}

async function consumeBucket(
  keyBase: string,
  cfg: RateLimitConfig,
  nowMs: number
): Promise<ConsumeResult> {
  await ensureScript();
  const redis = await getRedisClient();
  try {
    const res: any = await redis.evalsha(
      scriptState.sha!,
      2,
      keyBase,
      keyBase + ':deplete',
      nowMs,
      cfg.intervalMs,
      cfg.capacity,
      cfg.refill,
      cfg.cost ?? 1,
      cfg.blockAfterDeplete ?? 0,
      cfg.blockDurationSec ?? 0
    );
    // res = {allowed, tokens, ts, depletions, blocked}
    const allowed = res[0] === 1;
    const tokens = Number(res[1]);
    const blocked = res[4] === 1;
    return {
      allowed,
      remaining: tokens,
      reset: estimateResetTs(nowMs, cfg.intervalMs),
      blocked,
      reason: blocked ? 'blocked' : (!allowed ? 'depleted' : undefined),
    };
  } catch (err: any) {
    if (String(err?.message || err).includes('NOSCRIPT')) {
      scriptState.loaded = false;
      return consumeBucket(keyBase, cfg, nowMs); // retry once
    }
    logOnce(err);
    return {
      allowed: true,
      remaining: cfg.capacity,
      reset: estimateResetTs(nowMs, cfg.intervalMs),
      blocked: false,
    };
  }
}

export interface RateLimitOptions {
  group: string;
  identifyUser?: (req: Request) => string | null | undefined;
  userCost?: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { group, identifyUser } = options;
  const baseCfg = GROUPS[group] || GROUPS['default'];

  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const ip = normalizeIp(req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim());
    const bucketKey = `rl:${group}:${ip}`;

    const primary = await consumeBucket(bucketKey, baseCfg, now);

    // Attach headers for primary limiter
    res.setHeader('X-RateLimit-Limit', String(baseCfg.capacity));
    res.setHeader('X-RateLimit-Remaining', String(primary.remaining));
    res.setHeader('X-RateLimit-Reset', String(primary.reset));

    if (!primary.allowed) {
      if (primary.blocked) {
        res.setHeader('Retry-After', String(baseCfg.blockDurationSec ?? 60));
        res.setHeader('X-RateLimit-Reason', primary.reason || 'blocked');
        return res.status(429).json({ error: 'Too Many Requests' });
      }
      res.setHeader('Retry-After', '1');
      res.setHeader('X-RateLimit-Reason', primary.reason || 'depleted');
      return res.status(429).json({ error: 'Too Many Requests' });
    }

    // Optional user-level limiter (after auth)
    const userId = identifyUser?.(req);
    if (userId && baseCfg.userCapacity && baseCfg.userRefill && baseCfg.userIntervalMs) {
      const userCfg: RateLimitConfig = {
        intervalMs: baseCfg.userIntervalMs,
        capacity: baseCfg.userCapacity,
        refill: baseCfg.userRefill,
        cost: options.userCost ?? 1,
        blockAfterDeplete: baseCfg.blockAfterDeplete, // can mirror
        blockDurationSec: baseCfg.blockDurationSec,
      };
      const userKey = `rlu:${group}:${userId}`;
      const userRes = await consumeBucket(userKey, userCfg, now);
      res.setHeader('X-RateLimit-User-Remaining', String(userRes.remaining));
      if (!userRes.allowed) {
        res.setHeader('Retry-After', '1');
        res.setHeader('X-RateLimit-Reason', userRes.reason || 'user-depleted');
        return res.status(429).json({ error: 'Too Many Requests (User)' });
      }
    }

    return next();
  };
}

// Helper to register custom group dynamically (e.g., from config)
// Will override existing group if name collides.
export function registerRateLimitGroup(name: string, cfg: RateLimitConfig) {
  GROUPS[name] = cfg;
}

// Debug/status function (optional)
export function listRateLimitGroups(): Record<string, RateLimitConfig> {
  return { ...GROUPS };
}

/*
Example usage (NOT yet applied):

import { rateLimit } from '@/lib/rateLimiter';

authRouter.post(
  '/login',
  rateLimit({ group: 'auth-login' }),
  requireUnauthenticated,
  verifyRecaptcha,
  handler
);
*/