import Redis from 'ioredis';
import { getRedisClient } from './redisClient';

export async function scanKeys(redis: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, results] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...results);
  } while (cursor !== '0');

  return keys;
}


export async function scanKeysWithTTL(redis: Redis, pattern: string): Promise<{ key: string; ttl: number }[]> {
  const results: { key: string; ttl: number }[] = [];
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      // Fetch TTLs in parallel for the batch of keys
      const ttls = await Promise.all(keys.map(key => redis.ttl(key)));

      for (let i = 0; i < keys.length; i++) {
        results.push({ key: keys[i], ttl: ttls[i] });
      }
    }
  } while (cursor !== '0');

  return results;
}

export async function checkRedisHealth(timeoutMs = 2000): Promise<boolean> {
  try {
    // Create a timeout promise to avoid hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis health check timed out")), timeoutMs)
    );

    // Redis PING command returns "PONG" if healthy
    const pingPromise = (await getRedisClient()).ping();

    const result = await Promise.race([pingPromise, timeoutPromise]);

    return result === "PONG";
  } catch (err) {
    console.error("Redis health check failed:", err);
    return false;
  }
}