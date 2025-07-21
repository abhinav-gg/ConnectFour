// redisSchema.ts

export const RedisSchema = {
    cache: {
      userProfile: {
        key: (userId: string) => `cache:user:${userId}`,
        ttl: 60 * 60, // 1 hour
      },
    },
  
    session: {
        key: (userId: string) => `session:user:${userId}`,
        ttl: 60 * 60 * 24 * 7, // 7 days
    },
  
    auth: {
      emailVerification: {
        key: (email: string) => `email:verify:${email}`,
        ttl: 60 * 60 * 24, // 24 hours
      },
      passwordReset: {
        key: (email: string) => `email:reset:${email}`,
        ttl: 60 * 30, // 30 minutes
      },
    },
  };