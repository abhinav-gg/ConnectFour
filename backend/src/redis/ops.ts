import { getRedisClient } from './redisClient'; // Adjust the import path as necessary
import { UserOperations } from './repositories/userOps';

export async function redisOps() {
    const redis = await getRedisClient();
  
    return {
      user: UserOperations(redis),
  
      // You can add more modular ops below
      // session: createSessionOps(redis),
      // token: createTokenOps(redis),
    };
}