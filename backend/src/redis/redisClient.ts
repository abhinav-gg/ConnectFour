import Redis from 'ioredis';
import { myConfig } from '@config/env';

// Store clients by name
const clients = new Map<string, Redis>();

function createRedisClient(maxRetriesPerRequest: number | null): Redis {
  const client = new Redis({
    host: myConfig.REDIS_HOST || 'redis',
    port: Number(myConfig.REDIS_PORT) || 6379,
    password: myConfig.REDIS_PASSWORD, // Optional: set in your env
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[ioredis] reconnect attempt #${times}, delay ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: maxRetriesPerRequest,
  });

  client.on('connect', () => console.log('[ioredis] Connected Successfully!'));
  client.on('ready', () => console.log('✅ ioredis ready'));
  client.on('error', err => console.error('❌ ioredis error', err));
  client.on('close', () => console.log('🛑 ioredis connection closed'));
  client.on('reconnecting', (time: any) => console.log(`🔄 ioredis reconnecting in ${time}ms`));

  return client;
}

async function getClient(clientName: string): Promise<Redis> {
  if (clients.has(clientName)) {
    const client = clients.get(clientName)!;
    // ioredis does not have isOpen, but we can check status
    if (client.status === 'ready' || client.status === 'connecting') {
      return client;
    }
  }
  const client = createRedisClient(clientName === 'bullmq' ? null : 3);
  clients.set(clientName, client);
  return client;
}

export async function getBullMqRedisClient(): Promise<Redis> {
  return await getClient('bullmq');
}

export async function getRedisClient(): Promise<Redis> {
  return await getClient('business');
}

export async function getPubSubRedisClient(): Promise<Redis> {
  return await getClient('pubsub');
}

export async function closeAllClients() {
  for (const [key, client] of clients.entries()) {
    if (client && (client.status === 'ready' || client.status === 'connecting')) {
      await client.quit();
      console.log(`Redis client (${key}) disconnected`);
    }
  }
}
