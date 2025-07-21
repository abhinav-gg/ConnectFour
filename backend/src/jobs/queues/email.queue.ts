import { Queue } from 'bullmq';
import getRedisClient from '@/redis/redisClient'

export const emailQueue = new Queue('emailQueue', {
  connection: getRedisClient(),
  defaultJobOptions: {
    removeOnComplete: true, // Don't retain completed jobs
    removeOnFail: {
      count: 10,             // Keep only last 10 failed jobs
    },
    attempts: 3,             // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000,           // 1s delay between retries
    },
  }
});
