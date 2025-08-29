import { Queue } from 'bullmq';
import { setupEmailJobSet } from './sets/email';
import { setupGameDisconnectJobSet } from './sets/game.disconnection';
import { setupGameTimeoutJobSet } from './sets/game.timeout';
import { JobKeys } from './jobKeys';

// Process-wide singleton registry backed by globalThis to survive duplicate imports/HMR
const GLOBAL_QUEUE_STORE = Symbol.for('cf.jobs.QueueStore');
type QueueMap = Map<string, Queue>;
const QueueStore: QueueMap =
  ((globalThis as any)[GLOBAL_QUEUE_STORE] as QueueMap) ||
  ((globalThis as any)[GLOBAL_QUEUE_STORE] = new Map<string, Queue>());

// Log once
if (!(globalThis as any).__cf_loggedQueueStore) {
  (globalThis as any).__cf_loggedQueueStore = true;
  console.log('[Jobs] QueueStore initialized');
}

// Generic register helper (internal)
function registerQueue(name: string, queue: Queue) {
  QueueStore.set(name, queue);
}

// Public getters (centralized here)
export function getEmailQueue(): Queue {
  const q = QueueStore.get(JobKeys.email.queueName);
  if (!q) throw new Error('Email queue not initialized. Call setupAllJobs() first.');
  return q;
}

export function getGameDisconnectionQueue(): Queue {
  const q = QueueStore.get(JobKeys.game_disconnect.queueName);
  if (!q) throw new Error('Game disconnect queue not initialized. Call setupAllJobs() first.');
  return q;
}

export function getGameTimeoutQueue(): Queue {
  const q = QueueStore.get(JobKeys.game_timeout.queueName);
  if (!q) throw new Error('Game timeout queue not initialized. Call setupAllJobs() first.');
  return q;
}

// Ensure (setup-once) helpers
async function ensureQueue(name: string, setup: () => Promise<Queue>) {
  const existing = QueueStore.get(name);
  if (existing) return existing;
  const q = await setup();
  registerQueue(name, q);
  return q;
}

// Bootstrap API
export async function setupAllAPIJobs() {
  await ensureQueue(JobKeys.email.queueName, setupEmailJobSet);
  
}

// Bootstrap API
export async function setupAllSocketJobs() {
  await ensureQueue(JobKeys.game_disconnect.queueName, setupGameDisconnectJobSet);
  await ensureQueue(JobKeys.game_timeout.queueName, setupGameTimeoutJobSet);

}

// Optional: expose the store for diagnostics
export const JobSets = {
  getEmailQueue,
  getGameDisconnectionQueue,
};
