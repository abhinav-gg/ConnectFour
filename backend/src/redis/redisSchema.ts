// redisSchema.ts
// <domain>:<type>:<identifier>


export const RedisKeys = {
    // User session data (expires in 7 days)
    userSession: (userId: string) => `session:user:${userId}`,

    // Email verification tokens (expires in 24h)
    emailVerification: (token: string) => `email:verify:${token}`,

    // Password reset tokens (expires in 30m)
    passwordReset: (token: string) => `email:reset:${token}`,

    // // Rate limiting key (per IP) - MANAGED BY CLOUDFRONT
    // rateLimit: (ip: string) => `ratelimit:${ip}`,

    // Cache of user profile (optional TTL)
    userCache: (userId: string) => `cache:user:${userId}`,
};

export const RedisTTLs = {
    
    userSession: 60 * 60 * 24 * 7, // 7 days in seconds
    emailVerification: 60 * 60 * 24, // 24 hours in seconds
    passwordReset: 60 * 30, // 30 minutes in seconds
    userCache: 60 * 60, // 1 hour in seconds

};