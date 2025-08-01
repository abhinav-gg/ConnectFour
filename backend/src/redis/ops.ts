import { getRedisClient } from './redisClient'; // Adjust the import path as necessary
import { GameOperations } from './repositories/gameOps';
import { UserOperations } from './repositories/userOps';

export async function redisOps() {
    const redis = await getRedisClient();
  
    return {
      user: UserOperations(redis),
      game: GameOperations(redis),
    };
}