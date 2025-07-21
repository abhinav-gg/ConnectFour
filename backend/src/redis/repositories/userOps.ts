// src/repositories/userOps.ts
import { RedisClientType } from 'redis';
import { RedisSchema } from '../redisSchema'; // Adjust the import path as necessary

export function UserOperations(redis: RedisClientType) {
  
  const genRedisSessionKey = RedisSchema.session.key; // Adjust the key generation function as necessary
  const genRedisEmailKey = RedisSchema.auth.emailVerification.key; // Adjust the key generation function as necessary

  return {
    async setSession(sessionId: string, userId: string, ttl?: number): Promise<void> {
      const key = genRedisSessionKey(sessionId);
      await redis.set(key, `user:${userId}`, 
      { EX: ttl || RedisSchema.session.ttl }); // Default to 7 days if no ttl provided

      //await redis.expire(key, ttl); -- If we want to set expiration freshly
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




    async setEmailVerificationCode(userId: string, code: string, ttl?: number): Promise<void> {
      const key = `email_verification:${userId}:${code}`;
      await redis.set(key, "1", { EX: ttl || RedisSchema.auth.emailVerification.ttl });
    },

    async isEmailVerificationCodeValid(userId: string, code: string): Promise<boolean> {
      const key = `email_verification:${userId}:${code}`;
      return (await redis.exists(key)) === 1;
    },
  
    async dropEmailVerificationCode(userId: string): Promise<void> {
      const keys = await redis.keys(`email_verification:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    },

    async listEmailVerificationCodes(userId: string): Promise<string[]> {
      const keys = await redis.keys(`email_verification:${userId}:*`);
      return keys.map(key => key.split(":").pop()!);
    },









  };
}