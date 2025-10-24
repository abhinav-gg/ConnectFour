// // lib/jobs/createQueue.ts
// import { Queue, JobsOptions } from 'bullmq';
// import { getBullMqRedisClient } from '@/redis/redisClient';

// type CreateQueueOptions = {
//   queueName: string;
//   defaultJobOptions?: JobsOptions;
// };

// export async function createQueue<T = any>({
//   queueName,
//   defaultJobOptions,
// }: CreateQueueOptions) {
//   const connection = await getBullMqRedisClient();

//   return new Queue<T>(queueName, {
//     connection,
//     defaultJobOptions: {
//       removeOnComplete: true,
//       removeOnFail: { count: 10 },
//       attempts: 3,
//       backoff: {
//         type: 'exponential',
//         delay: 1000,
//       },
//       ...(defaultJobOptions || {}),
//     },
//   });
// }
