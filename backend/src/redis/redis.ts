// redisClient.ts
import { createClient, RedisClientType } from 'redis';
import { myConfig } from '../../config/env';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client && client.isOpen) return client;

  let retryCount = 0;
  const maxRetries = 10;

  console.log('Connecting to Redis...', myConfig.REDIS_HOST, myConfig.REDIS_PORT);

  client = createClient({
    socket: {
      host: myConfig.REDIS_HOST,
      port: Number(myConfig.REDIS_PORT),
      reconnectStrategy: (retries: number) => {
        retryCount = retries;

        if (retries >= maxRetries) {
          console.error(`❌ Redis reconnect failed after ${retries} attempts`);
          return new Error('Max reconnect attempts reached');
        }

        // Wait 1 second before next attempt
        return 1000;
      }
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
  });

  await client.connect();
  return client;
}
