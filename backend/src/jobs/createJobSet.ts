// lib/jobs/createJobSet.ts
import { Queue, Worker, Processor, JobsOptions } from 'bullmq';
import { getBullMqRedisClient } from '@/redis/redisClient';

type JobSetOptions<T> = {
  queueName: string;
  processor: Processor<T, any, string>;
  defaultJobOptions?: JobsOptions;
  concurrency?: number;
  lockDuration?: number;
  limiter?: {
    max: number;
    duration: number;
  };
};

export async function createJobSet<T = any>({
  queueName,
  processor,
  defaultJobOptions,
  concurrency = 5,
  lockDuration = 15000,
  limiter = {
    max: 10,
    duration: 1000,
  },
}: JobSetOptions<T>) {
  const connection = await getBullMqRedisClient();

  const queue = new Queue<T>(queueName, {
    connection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: { count: 10 },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      ...defaultJobOptions,
    },
  });

  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
    lockDuration,
    limiter,
  });

  worker.on('completed', job => {
    console.log(`[${queueName}] ✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${queueName}] ❌ Job ${job?.id} failed:`, err);
  });

  return { queue, worker };
}
