// src/repositories/userOps.ts
import Redis from 'ioredis';
import { RedisSchema } from '../redisSchema'; // Adjust the import path as necessary
import { scanKeys, scanKeysWithTTL } from '../redisHelper';

export function UserOperations(redis: Redis) {
  const genRedisSessionKey = RedisSchema.session.key; // Adjust the key generation function as necessary
  const genRedisEmailKey = RedisSchema.auth.emailVerification.key; // Adjust the key generation function as necessary
  const getRedisEmailBase = RedisSchema.auth.emailVerification.pattern;

  return {

    async setSession(sessionId: string, userId: string, ttl?: number): Promise<void> {
      const key = genRedisSessionKey(sessionId);
      // Use EX for seconds TTL (ioredis supports this natively)
      await redis.set(key, `user:${userId}`, 'EX', ttl || RedisSchema.session.ttl);
    },  

    async setAnonymousSession(sessionId: string, ttl?: number): Promise<void> {
      await this.setSession(sessionId, "anon:", ttl || RedisSchema.session.ttl);
    },

    async getSession(sessionId: string): Promise<string | null> {
      const key = genRedisSessionKey(sessionId);
      return await redis.get(key);
    },

    async dropSession(sessionId: string) {
      const key = genRedisSessionKey(sessionId);
      return await redis.get(key);
    },

    // Set new code
    async setEmailCode(email: string, code: string): Promise<void> {
      const key = genRedisEmailKey(email, code);
      await redis.set(key, '1', 'EX', RedisSchema.auth.emailVerification.ttl);
    },

    // Validate code
    async validateEmailCode(email: string, code: string): Promise<boolean> {
      const key = genRedisEmailKey(email, code);
      const exists = await redis.exists(key);
      if (exists) {
        return true;
      }
      return false;
    },

    async getEmailCodeTTLs(email: string) {
      // scan for all of their email verify keys
 
      const pattern = `email:verify:${email}:*`;
      return await scanKeysWithTTL(redis, pattern);

    },

    // Delete all active codes for an email
    async deleteAllCodes(email: string): Promise<void> {
      const pattern = getRedisEmailBase(email);
      const keys = await scanKeys(redis, pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    },


















































  };
}