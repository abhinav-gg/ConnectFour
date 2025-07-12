import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

export const emailQueue = new Queue('emailQueue', {
  connection: redisConnection,
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
    timeout: 10000,          // Auto-fail after 10 seconds
  },
  limiter: {
    max: 10,                 // Max 10 jobs per second
    duration: 1000,
  },
});
