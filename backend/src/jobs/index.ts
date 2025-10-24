// src/jobs/index.ts
import { Queue } from 'bullmq';
import { setupEmailJobSet } from './sets/email';
import { setupGameDisconnectJobSet } from './sets/game.disconnection';
import { setupGameTimeoutJobSet } from './sets/game.timeout';
import { JobKeys } from './jobKeys';

/**
 * Global singleton registry for queues.
 * Ensures a single Queue instance per name, even across hot reloads.
 */
const QUEUE_REGISTRY_KEY = Symbol.for('cf.jobs.QueueRegistry');
type QueueRegistry = Map<string, Queue>;

const globalStore = globalThis as Record<symbol, any>;
const queueRegistry: QueueRegistry =
  globalStore[QUEUE_REGISTRY_KEY] ?? (globalStore[QUEUE_REGISTRY_KEY] = new Map());

if (!queueRegistry.has('__init__')) {
  console.log('[Jobs] Queue registry initialized');
}

/** Lazily registers or returns an existing queue */
async function registerQueue(name: string, setupFn: () => Promise<Queue>): Promise<Queue> {
  if (queueRegistry.has(name)) return queueRegistry.get(name)!;
  const queue = await setupFn();
  queueRegistry.set(name, queue);
  return queue;
}

/** Retrieves a queue with descriptive error if missing */
function getQueue(name: string, label: string): Queue {
  const q = queueRegistry.get(name);
  if (!q) throw new Error(`[Jobs] ${label} queue not initialized?`);
  return q;
}

// ---- Public setup APIs ---- //

export async function setupAllAPIJobs(): Promise<void> {
  await registerQueue(JobKeys.email.queueName, setupEmailJobSet);
}

export async function setupAllSocketJobs(): Promise<void> {
  await Promise.all([
    registerQueue(JobKeys.game_disconnect.queueName, setupGameDisconnectJobSet),
    registerQueue(JobKeys.game_timeout.queueName, setupGameTimeoutJobSet),
  ]);
}

// ---- Public accessors ---- //

export const JobRegistry = {
  getEmailQueue: () => getQueue(JobKeys.email.queueName, 'Email'),
  getGameDisconnectionQueue: () =>
    getQueue(JobKeys.game_disconnect.queueName, 'Game disconnection'),
  getGameTimeoutQueue: () =>
    getQueue(JobKeys.game_timeout.queueName, 'Game timeout'),
  getQueueCount: () => queueRegistry.size - 1, // minus marker
  getAllQueueNames: () =>
    Array.from(queueRegistry.keys()).filter(k => k !== '__init__'),
} as const;