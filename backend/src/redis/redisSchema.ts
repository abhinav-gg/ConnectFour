// redisSchema.ts
// <domain>:<type>:<identifier>


export const RedisKeys = {
    // User session data (expires in 7 days)
    userSession: (userId: string) => `session:user:${userId}`,

    // Email verification tokens (expires in 24h)
    emailVerification: (token: string) => `email:verify:${token}`,

    // Password reset tokens (expires in 30m)
    passwordReset: (token: string) => `password:reset:${token}`,

    // // Rate limiting key (per IP) - MANAGED BY CLOUDFRONT
    // rateLimit: (ip: string) => `ratelimit:${ip}`,

    // Cache of user profile (optional TTL)
    userCache: (userId: string) => `cache:user:${userId}`,
};

export const RedisPrefixes = {
    // User session data (expires in 7 days)
    userSession: 'session:user:',

    // Email verification tokens (expires in 24h)
    emailVerification: 'email:verify:',

    // Password reset tokens (expires in 30m)
    passwordReset: 'password:reset:',

    // // Rate limiting key (per IP) - MANAGED BY CLOUDFRONT
    // rateLimit: 'ratelimit:',

    // Cache of user profile (optional TTL)
    userCache: 'cache:user:',
};