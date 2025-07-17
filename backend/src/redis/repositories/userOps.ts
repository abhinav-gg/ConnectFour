// src/repositories/userOps.ts
import { RedisClientType } from 'redis';
import { RedisKeys, RedisTTLs } from '../redisSchema'; // Adjust the import path as necessary


export function UserOperations(redis: RedisClientType) {
  
  const genRedisSessionKey = RedisKeys.userSession; // Adjust the key generation function as necessary
  const genRedisEmailKey = RedisKeys.emailVerification; // Adjust the key generation function as necessary

  return {
    async setSession(sessionId: string, userId: string, ttl?: number): Promise<void> {
      const key = genRedisSessionKey(sessionId);
      await redis.set(key, `user:${userId}`, 
      { EX: ttl || RedisTTLs.userSession }); // Default to 7 days if no ttl provided

      //await redis.expire(key, ttl); -- If we want to set expiration freshly
    },  

    async setAnonymousSession(sessionId: string, ttl?: number): Promise<void> {
      await this.setSession(sessionId, "anon:", ttl || RedisTTLs.userSession);
    },

    async getSession(sessionId: string): Promise<string | null> {
      const key = genRedisSessionKey(sessionId);
      return await redis.get(key);
    },

    async dropSession(sessionId: string) {
      const key = genRedisSessionKey(sessionId);
      return await redis.get(key);
    },

    async setEmailVerificationCode(userId: string, code: number, ttl?: number): Promise<void> {
      const key = genRedisEmailKey(code.toString());
      await redis.set(key, userId, { EX: ttl || RedisTTLs.emailVerification }); // Default to 24 hours if no ttl provided
    },

    async getEmailVerificationCode(userId: string): Promise<string | null> {
      const key = genRedisEmailKey(userId);
      return await redis.get(key);
    },

    async dropEmailVerificationCode(code: number): Promise<void> {
      const key = genRedisEmailKey(code.toString());
      await redis.del(key);
    },











  };
}