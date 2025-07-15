import { createClient, RedisClientType } from 'redis';
import { myConfig } from '@config/env';

let client: RedisClientType | null = null;
let connectingPromise: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client && client.isOpen) return client;

  // If a connection attempt is already ongoing, wait for it
  if (connectingPromise) return await connectingPromise;

  connectingPromise = (async () => {
    let retryCount = 0;
    const maxRetries = 10;

    console.log('🔌 Connecting to Redis...', myConfig.REDIS_HOST, myConfig.REDIS_PORT);

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

          return 1000; // retry after 1s
        }
      }
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
    });

    await client.connect();
    console.log('✅ Redis connected');
    return client;
  })();

  return await connectingPromise;
}

export async function closeRedisClient() {
  if (client && client.isOpen) {
    await client.disconnect();
    console.log('Redis client disconnected');
  }
}
