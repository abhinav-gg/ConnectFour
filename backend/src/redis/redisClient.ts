import { createClient } from 'redis';
import { myConfig } from '@config/env';

// Use Maps to store clients and their connecting promises
const clients = new Map<string, any>();
const connectingPromises = new Map<string, Promise<any>>();

async function createRedisClient() {
  let retryCount = 0;
  const maxRetries = 10;

  const client = createClient({
    socket: {
      host: myConfig.REDIS_HOST,
      port: Number(myConfig.REDIS_PORT),
      reconnectStrategy: (retries: number) => {
        retryCount = retries;
        if (retries >= maxRetries) {
          console.error(`❌ Redis reconnect failed after ${retries} attempts`);
          return new Error('Max reconnect attempts reached');
        }
        return 1000; // retry after 1 second
      },
    },
  });

  client.on('error', (err: Error) => {
    console.error('Redis Client Error:', err.message);
  });

  await client.connect();
  console.log('✅ Redis connected');
  return client;
}

async function getClient(clientName: string) {
  if (clients.has(clientName)) {
    const client = clients.get(clientName);
    if (client.isOpen) {
      return client;
    }
  }

  if (connectingPromises.has(clientName)) {
    return connectingPromises.get(clientName)!;
  }

  const promise = createRedisClient()
    .then((client) => {
      clients.set(clientName, client);
      connectingPromises.delete(clientName);
      return client;
    })
    .catch((err) => {
      connectingPromises.delete(clientName);
      throw err;
    });

  connectingPromises.set(clientName, promise);

  return promise;
}

export async function getBullMqClient() {
  return getClient('bullmq');
}

export async function getRedisClient() {
  return getClient('business');
}

export async function getPubSubRedisClient() {
  return getClient('pubsub');
}

export async function closeAllClients() {
  for (const [key, client] of clients.entries()) {
    if (client && client.isOpen) {
      await client.disconnect();
      console.log(`Redis client (${key}) disconnected`);
    }
  }
}
