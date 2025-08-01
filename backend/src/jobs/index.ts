import { setupEmailJobSet } from './sets/email';
import { Queue } from 'bullmq/dist/esm/classes/queue';

export async function setupAllJobs() {
  await setupEmailJobSet();
  // Add other job sets here
}