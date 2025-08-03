import Redis from 'ioredis';
import { getRedisClient } from './redisClient';

export async function scanKeysPaginated(
  redis: Redis,
  pattern: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ keys: string[]; nextCursor: string }> {
  let cursor = '0';
  let collected: string[] = [];
  let currentPage = 1;

  while (true) {
    const [nextCursor, results] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', pageSize);
    if (currentPage === page) {
      return { keys: results, nextCursor };
    }
    cursor = nextCursor;
    if (cursor === '0') break;
    currentPage++;
  }

  return { keys: [], nextCursor: '0' };
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

export function createRedisJson(redis: Redis) {
  return {
    async set(key: string, path = '$', value: any): Promise<'OK'> {
      return redis.call('JSON.SET', key, path, JSON.stringify(value)) as Promise<'OK'>;
    },

    async get<T = any>(key: string, path = '$'): Promise<T | null> {
      const res = await redis.call('JSON.GET', key, path) as string | null;
      if (!res) return null;
      return JSON.parse(res) as T;
    },

    async del(key: string, path = '$'): Promise<number> {
      // Returns number of paths deleted
      return redis.call('JSON.DEL', key, path) as Promise<number>;
    },

    async exists(key: string, path = '$'): Promise<boolean> {
      const exists = await redis.call('JSON.TYPE', key, path) as string;
      return exists !== 'null';
    },

    async arrappend(key: string, path: string, value: any): Promise<number> {
      // Returns the new length of the array after appending
      return redis.call('JSON.ARRAPPEND', key, path, JSON.stringify(value)) as Promise<number>;
    }
  };
}
