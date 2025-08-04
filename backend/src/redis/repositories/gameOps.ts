// src/repositories/gameOps.ts
import Redis from 'ioredis';
import { GameMetadata, GameTimedata, RedisSchema, UserQueue } from '../redisSchema'; // Adjust the import path as necessary
import { createRedisJson, scanKeysPaginated } from '../redisHelper';
import { Move } from '@shared/types/game';
import { getQueuePriority } from '@/utils/game';

export async function setupGameMetaIndex(redis: Redis): Promise<void> {
  try {
    await redis.call('FT.CREATE', 'idx:game:meta',
      'ON', 'JSON',
      'PREFIX', '1', 'game:live:',
      'SCHEMA',
      '$.shortcode', 'AS', 'shortcode', 'TEXT'
    );

    console.log('[Redis] Game meta index created.');
  } catch (err: any) {
    if (err.message?.includes('Index already exists')) {
      console.log('[Redis] Index already exists, skipping creation.');
    } else {
      console.error('[Redis] Failed to create index:', err);
      throw err;
    }
  }
}

export async function setupUserQueueGamemodeIndex(redis: Redis): Promise<void> {
  try {
    await redis.call('FT.CREATE', 'idx:user:queue:gamemode',
      'ON', 'JSON',
      'PREFIX', '1', 'user:queue:',
      'SCHEMA',
      '$.gamemode', 'AS', 'gamemode', 'TEXT'
    );
    console.log('[Redis] User queue gamemode index created.');
  } catch (err: any) {
    if (err.message?.includes('Index already exists')) {
      console.log('[Redis] User queue gamemode index already exists, skipping creation.');
    } else {
      console.error('[Redis] Failed to create user queue gamemode index:', err);
      throw err;
    }
  }
}

export function GameOperations(redis: Redis) {

  const redisJson = createRedisJson(redis);

  const genRedisGameMove = RedisSchema.game.moves.key; // Adjust the key generation function as necessary
  const genRedisGameMeta = RedisSchema.game.metadata.key; // Adjust the key generation function as necessary
  const genRedisGameTime = RedisSchema.game.live.key; // Adjust the key generation function as necessary
  const genRedisUserKey = RedisSchema.user.queue.key; // Adjust the key generation function as necessary


  return {
    
    async dropGame(gameId: string): Promise<void> {
      const { keys } = await scanKeysPaginated(redis, genRedisGameMove(gameId));
      console.log("Dropping game with ID:", gameId, "Keys found:", keys);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },
    


    async addGameMove(gameId: string, move: Move, ttl?: number): Promise<void> {
      const key = genRedisGameMove(gameId);
      await redis.rpush(key, move);
      await redis.expire(key, ttl || RedisSchema.game.ttl);
    },  

    async getGameMoves(gameId: string): Promise<Move[]> {
      const key = genRedisGameMove(gameId);
      const moves = await redis.lrange(key, 0, -1);
      return moves.map(move => JSON.parse(move));
    },

    async setInitGameMoves(gameId: string, ttl?: number): Promise<void> {
      const key = genRedisGameMove(gameId);
      await redis.del(key); // Remove any existing moves list
    },

    ///////////////////////////////////

    async getGameMetadata(gameId: string): Promise<GameMetadata | null> {
      const key = genRedisGameMeta(gameId)
      const rawJson = await redisJson.get(key);
      if (!rawJson || !Array.isArray(rawJson) || rawJson.length !== 1) return null;

      try {
        return RedisSchema.game.metadata.schema.parse(rawJson[0]);
      } catch (err) {
        console.error('Invalid data in Redis:', err);
        return null; // or throw, depending on your design
      }
    },

    async setInitialMetadata(gameId: string, meta: GameMetadata, ttl?: number): Promise<void> {
      const key = genRedisGameMeta(gameId);
      await redis.call('JSON.SET', key, '$', JSON.stringify(meta));
    }, 

    async updateGameMetadata(gameId: string, updates: Partial<GameMetadata>): Promise<void> {
      const key = genRedisGameMeta(gameId);
      const currentMeta = await this.getGameMetadata(gameId);
      if (!currentMeta) {
        throw new Error('Game metadata not found');
      }

      const updatedMeta = { ...currentMeta, ...updates };
      await redis.call('JSON.SET', key, '$', JSON.stringify(updatedMeta));
    },

    async addUserToGameMetadata(gameId: string, userId: string): Promise<void> {
      const key = genRedisGameMeta(gameId);
      await redisJson.arrappend(key, '$.players', userId);
    },

    async updateGameMetadataState(gameId: string, newState: number): Promise<void> {
      const key = genRedisGameMeta(gameId);
      await redisJson.set(key, '$.state', newState);
    },


    async cancelGameDrawOffer(gameId: string): Promise<void> {
      const key = genRedisGameMeta(gameId);
      await redisJson.set(key, '$.drawOffer', [false, false]);
    },


    ///////////////////////////////////////////////////////////////////////

    async getGameTimes(gameId: string): Promise<GameTimedata | null> {
      const key = genRedisGameTime(gameId)
      const rawJson =  await redis.call('JSON.GET', key, '$');
      if (!rawJson) return null;

      try {
        const parsed = JSON.parse(rawJson as string)[0];
        return RedisSchema.game.live.schema.parse(parsed);
      } catch (err) {
        console.error('Invalid data in Redis:', err);
        return null; // or throw, depending on your design
      }
    },

    async setInitialTimedata(gameId: string, ttl?: number): Promise<void> {
      const key = genRedisGameTime(gameId);
      await redis.call('JSON.SET', key, '$', JSON.stringify({
        cTurn: 0,
        mTimes: [],
        rTimes: [],
        lMove: null,
        draws: [],
      } as GameTimedata));
    },

    async updateGameTimedata(gameId: string, updates: Partial<GameTimedata>): Promise<void> {
      const key = genRedisGameTime(gameId);
      const currentTimedata = await this.getGameTimes(gameId);
      if (!currentTimedata) {
        throw new Error('Game timedata not found');
      }

      const updatedTimedata = { ...currentTimedata, ...updates };
      await redis.call('JSON.SET', key, '$', JSON.stringify(updatedTimedata));
    },

    ////////////////////////////////////////////////////////////

    async updateGameTimeAfterMove(
      gameId: string,
      newMoveTime: number,
      newTurn: number,
      rTimes: [number, number],
      lastMoveTimestamp: number
    ): Promise<void> {
      const key = genRedisGameTime(gameId);
    
      await redis
        .multi()
        .call('JSON.ARRAPPEND', key, '$.mTimes', newMoveTime)
        .call('JSON.SET', key, '$.cTurn', newTurn)
        .call('JSON.SET', key, '$.rTimes', JSON.stringify(rTimes))
        .call('JSON.SET', key, '$.lMove', lastMoveTimestamp)
        .exec();
    },





    
    async findGameByShortcode(shortcode: string): Promise<string | null> {
      const result = await redis.call('FT.SEARCH', 'idx:game:meta', `@shortcode:${shortcode}`, 'LIMIT', '0', '1')
      const [total, ...rest] = result as any[];
      
      if (total === 0) return null;
      
      const redisKey = rest[0];

      const parts = redisKey.split(':');
      return parts[2] || null;
    },


    ////////////////////////////////////////////////////


    async getUserQueueGameId(userId: string): Promise<string | null> {
      const key = genRedisUserKey(userId);
      const raw = await redisJson.get(key, '$.gameId') as string[] | null;
      if (!raw || raw.length !== 1) return null;
      return raw[0];  
    },

    async leaveUserQueue(userId: string): Promise<void> {
      const key = genRedisUserKey(userId);
      await redis.del(key);
    },

    async addOrUpdateUserGameQueue(userId: string, data: UserQueue, ttl?: number): Promise<void> {
      const key = genRedisUserKey(userId);

      // Store the full JSON object at root path
      await redisJson.set(key, '$', data);

      await redis.expire(key, ttl || RedisSchema.user.queue.ttl);
      
    },

    async assignUserToGameQueue(userId: string, gameId: string, elo?: number | null): Promise<void> {
      const key = genRedisUserKey(userId);
      
      await redisJson.set(key, '$.gameId', gameId);
      if (elo != null) {
        await redisJson.set(key, '$.elo', elo);
      } else {
        await redisJson.del(key, '$.elo');
      }
      
    },

    async filterPotentialQueueMatches(gamemode: string, elo?: number | null, limit = 10): Promise<string[]> {

      const now = Date.now();
      // Use Redisearch index for efficient filtering
      const query = elo != null
      ? `@gamemode:{${gamemode}}`
      : `@gamemode:{${gamemode}}`;

      // Search using the index
      const result = await redis.call(
      'FT.SEARCH',
      'idx:user:queue:gamemode',
      query,
      'LIMIT', '0', String(limit)
      ) as any[];

      console.log("Potential matches found:", result);

      const total = result[0] as number;
      if (total === 0) return [];

      // Each result: [redisKey, flatData, ...]
      const users: { userId: string, priority: number }[] = [];
      for (let i = 1; i < result.length; i += 2) {
        const redisKey = result[i] as string;
        const flatData = result[i + 1] as Record<string, string>;
        const raw = flatData['$'] || flatData['$.gamemode'];
        if (!raw) continue;
        try {
          const data = typeof raw === 'string' ? JSON.parse(raw) as UserQueue : raw as UserQueue;
          const userId = redisKey.split(':').pop()!;
          const priority = elo != null ? getQueuePriority(now - data.timeAdded, elo) : data.timeAdded;
          users.push({ userId, priority });
          if (users.length >= limit) break;
        } catch {
          continue;
        }
      }

      // If elo is specified, sort by priority
      if (elo != null) {
        users.sort((a, b) => b.priority - a.priority);
      }

      return users.map(u => u.userId).slice(0, limit);
    },


  }
}   