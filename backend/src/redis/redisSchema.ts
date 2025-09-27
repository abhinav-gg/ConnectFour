// redisSchema.ts
import { z } from 'zod';

export const GameMetadataSchema = z.object({
  shortcode: z.string().length(8).nullable().optional(),
  players: z.array(z.string()),
  startTimestamp: z.number().nullable(),
  gamemode: z.number(),
  base_time: z.number(),
  increment: z.number(),
  disadvantage: z.number(),
  state: z.number(),
});

export type GameMetadata = z.infer<typeof GameMetadataSchema>;

export const GameTimedataSchema = z.object({
  cTurn: z.number(),
  mTimes: z.array(z.number()),
  rTimes: z.array(z.number()).nullable(),
  lMove: z.number().nullable(),
  drawOffer: z.array(z.boolean()).nullable(),
});

export type GameTimedata = z.infer<typeof GameTimedataSchema>;


export const UserQueueSchema = z.object({
  gameinfo: z.number(),
  timeAdded: z.number(),
  elo: z.number().nullable().optional(),
  gameId: z.string().nullable().optional(),
});

export type UserQueue = z.infer<typeof UserQueueSchema>;

export const RedisSchema = {
    cache: {
      userProfile: {
        key: (userId: string) => `cache:user:${userId}`,
        ttl: 60 * 60, // 1 hour
      },
    },
  
    session: {
        key: (userId: string) => `session:user:${userId}`,
        ttl: 60 * 60 * 24, // 24 hours
    },
    
    auth: {
      emailVerification: {
        key: (email: string, code: string) => `email:verify:${email}:${code}`,
        pattern: (email: string) => `email:verify:${email}`,
        ttl: 60 * 60 * 24, // 24 hours
      },
      passwordReset: {
        key: (email: string) => `email:reset:${email}`,
        ttl: 60 * 30, // 30 minutes
      },
      googleOAuthState: {
        key: (state: string) => `auth:google:${state}`,
        ttl: 60 * 5, // 5 minutes
      },
    },
    

    user: {
      queue: {
        key: (userId: string) => `user:queue:${userId}`,
        pattern: 'user:queue:',
        schema: GameMetadataSchema,
        ttl: 10 * 60, // 10 minutes
      },
    },
    
    game: {
      metadata: {
        key: (gameId: string) => `game:live:${gameId}:meta`,
        pattern: (gameId: string) => `game:live:${gameId}:meta`,
        schema: GameMetadataSchema
      },
      moves: {
        key: (gameId: string) => `game:live:${gameId}`,
        pattern: (gameId: string) => `game:live:${gameId}`,
      },
      live: {
        key: (gameId: string) => `game:live:${gameId}:live`,
        pattern: (gameId: string) => `game:live:${gameId}:live`,
        schema: GameTimedataSchema
      },
      ttl: 60 * 60 * 24, // 24 hours





    }













  };