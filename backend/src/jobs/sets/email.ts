// lib/jobs/sets/email.ts
import { createJobSet } from '../utils/createJobSet';
import { sendEmail } from '@/lib/email/emails';
import type { Queue } from 'bullmq';
import { JobKeys } from '../jobKeys';

export async function setupEmailJobSet(): Promise<Queue> {
  const { queue } = await createJobSet({
    queueName: JobKeys.email.queueName,
    processor: async (job) => {
      const { to, subject, html } = job.data;
      await sendEmail(to, subject, html);
    },
  });

  return queue;
}

// Note: Getters are centralized in jobs/index.ts
