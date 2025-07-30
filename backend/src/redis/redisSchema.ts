// redisSchema.ts
import { z } from 'zod';

export const GameMetadataSchema = z.object({
  shortcode: z.string().length(8).nullable().optional(),
  players: z.array(z.string()),
  startTimestamp: z.number(),
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
  rTime: z.array(z.number()),
  lMost: z.number(),
});

export type GameTimedata = z.infer<typeof GameTimedataSchema>;


export const UserQueueSchema = z.object({
  gameId: z.string(),
  mode: z.number(),
  timeAdded: z.number(),
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
        ttl: 60 * 60 * 24 * 7, // 7 days
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
    },
    

    user: {
      queue: {
        key: (gameId: string) => `user:queue:${gameId}`,
        pattern: (gameId: string) => `user:queue:${gameId}`,
        schema: GameMetadataSchema
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
      times: {
        key: (gameId: string) => `game:live:${gameId}:time`,
        pattern: (gameId: string) => `game:live:${gameId}:time`,
        schema: GameTimedataSchema
      },
      ttl: 60 * 60 * 24, // 24 hours





    }













  };