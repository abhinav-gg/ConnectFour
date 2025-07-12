import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { sendEmail } from '@/lib/email/sendEmail';

export const emailWorker = new Worker('emailQueue', async (job) => {
  const { to, subject, html } = job.data;
  await sendEmail(to, subject, html);
}, {
  connection: redisConnection,
  concurrency: 5, // Run 5 jobs in parallel
  lockDuration: 15000, // Prevent multiple workers from running same job
});
