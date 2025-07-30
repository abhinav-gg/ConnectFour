// src/repositories/gameOps.ts
import Redis from 'ioredis';
import { GameMetadata, GameTimedata, RedisSchema } from '../redisSchema'; // Adjust the import path as necessary
import { scanKeys } from '../redisHelper';
import { Move } from '@shared/types/game';

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


export function GameOperations(redis: Redis) {

  const genRedisGameMove = RedisSchema.game.moves.key; // Adjust the key generation function as necessary
  const genRedisGameMeta = RedisSchema.game.metadata.key; // Adjust the key generation function as necessary
  const genRedisGameTime = RedisSchema.game.times.key; // Adjust the key generation function as necessary
  const genRedisUserKey = RedisSchema.user.queue.key; // Adjust the key generation function as necessary


  return {
    
    
    async addGameMove(gameId: string, move: Move, ttl?: number): Promise<void> {
      const key = genRedisGameMove(gameId);
      await redis.rpush(key, move, 'EX', ttl || RedisSchema.game.ttl);
    },  

    async dropGame(gameId: string): Promise<void> {
      const keys = await scanKeys(redis, genRedisGameMove(gameId));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },

    async getGameMetadata(gameId: string): Promise<GameMetadata | null> {
      const key = genRedisGameMeta(gameId)
      const rawJson = await redis.get(key);
      if (!rawJson) return null;

      try {
        const parsed = JSON.parse(rawJson);
        return RedisSchema.game.metadata.schema.parse(parsed);
      } catch (err) {
        console.error('Invalid data in Redis:', err);
        return null; // or throw, depending on your design
      }
    },

    async getGameTimes(gameId: string): Promise<GameTimedata | null> {
      const key = genRedisGameTime(gameId)
      const rawJson =  await redis.call('JSON.GET', key, '$');
      if (!rawJson) return null;

      try {
        const parsed = JSON.parse(rawJson as string)[0];
        return RedisSchema.game.times.schema.parse(parsed);
      } catch (err) {
        console.error('Invalid data in Redis:', err);
        return null; // or throw, depending on your design
      }
    },


    async setInitialMetadata(gameId: string, meta: GameMetadata, ttl?: number): Promise<void> {
      const key = genRedisGameMeta(gameId);
      await redis.call('JSON.SET', key, '$', JSON.stringify(meta));
    }, 

    async setInitialTimedata(gameId: string, timedata: GameTimedata, ttl?: number): Promise<void> {
      const key = genRedisGameTime(gameId);
      await redis.call('JSON.SET', key, '$', JSON.stringify(timedata));
    }, 

    
    async findGameByShortcode(shortcode: string): Promise<string | null> {
      const result = await redis.call('FT.SEARCH', 'idx:game:meta', `@shortcode:${shortcode}`, 'LIMIT', '0', '1');

      const [total, ...rest] = result as any[];

      if (total === 0) return null;

      const redisKey = rest[0];
      const flatData = rest[1] as Record<string, string>;

      const shortcodeValue = flatData['$.shortcode'];
      console.log("FOUND BY", shortcodeValue)

      return redisKey;
    },


    async getUserQueueGameId(userId: string): Promise<string | null> {
      const key = genRedisUserKey(userId);
      const raw = await redis.get(key);
      if (!raw) return null;
    
      try {
        const data = JSON.parse(raw);
        return data?.gameId ?? null;
      } catch (err) {
        console.error('[getUserQueueGameId] Invalid queue data:', err);
        return null;
      }
    },

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





















  };
}   