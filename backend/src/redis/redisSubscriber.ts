// src/redis/subscriber.ts
import { createClient } from 'redis';
import { myConfig } from '@config/env';

const subscriber = createClient({
  socket: {
    host: myConfig.REDIS_HOST,
    port: Number(myConfig.REDIS_PORT),
  },
});

subscriber.on('error', (err) => {
  console.error('Redis Subscriber Error:', err.message);
});

export default subscriber;
