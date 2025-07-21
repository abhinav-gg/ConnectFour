import { Worker } from 'bullmq';
import { getRedisClient } from '@/redis/redisClient';
import { sendEmail } from '@/lib/email/emails';


export const emailWorker = new Worker('emailQueue', async (job) => {
  const { to, subject, html } = job.data;
  await sendEmail(to, subject, html);
}, {
  connection: getRedisClient(),
  concurrency: 5, // Run 5 jobs in parallel
  lockDuration: 15000, // Prevent multiple workers from running same job
  limiter: {
    max: 10,                 // Max 10 jobs per second
    duration: 1000,
  },
});

// Optional logging
emailWorker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});


// await emailQueue.add(
//   'sendWelcomeEmail', // Job name (optional but useful)
//   {
//     to: 'user@example.com',
//     subject: 'Welcome!',
//     body: 'Thanks for signing up!',
//   },
//   {
//     timeout: 10000, // Optional per-job timeout (10 seconds)
//     delay: 30000,   // Optional delay (30 seconds)
//   }
// );