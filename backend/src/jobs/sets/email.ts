// lib/jobs/sets/email.ts
import { createJobSet } from '../createJobSet';
import { sendEmail } from '@/lib/email/emails';
import type { Queue } from 'bullmq';

let emailQueue: Queue | undefined;

export async function setupEmailJobSet() {
  const { queue } = await createJobSet({
    queueName: 'emailQueue',
    processor: async (job) => {
      const { to, subject, html } = job.data;
      await sendEmail(to, subject, html);
    },
  });

  emailQueue = queue;
}

export function getEmailQueue(): Queue {
  if (!emailQueue) {
    throw new Error('Email queue not initialized. Call setupEmailJobSet() first.');
  }
  return emailQueue;
}



// await getEmailQueue().add('delayed-reminder', {
//   to: 'user@example.com',
//   subject: 'Reminder!',
//   html: '<p>Your event starts soon.</p>',
// }, {
//   delay: 5 * 60 * 1000, // 5 minutes delay
// });