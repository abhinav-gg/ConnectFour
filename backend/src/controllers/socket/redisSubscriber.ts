
import subscriber from '@/redis/redisSubscriber'
import { getRedisClient } from '@/redis/redisClient' 

subscriber.subscribe('leaderboard-updated', async () => {

  // const leaderboard = await getRedisClient().;
  // io.emit('leaderboard-update', leaderboard);

});

