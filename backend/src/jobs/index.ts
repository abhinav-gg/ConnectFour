import { Queue } from 'bullmq';
import { setupEmailJobSet } from './sets/email';
import { setupGameDisconnectJobSet } from './sets/game.disconnection';
import { setupGameTimeoutJobSet } from './sets/game.timeout';
import { JobKeys } from './jobKeys';

// Process-wide singleton registry backed by globalThis to survive duplicate imports/HMR
const GLOBAL_QUEUE_STORE = Symbol.for('cf.jobs.QueueStore');
const GLOBAL_LOG_FLAG = Symbol.for('cf.jobs.LogFlag');

type QueueMap = Map<string, Queue>;
type QueueSetupFunction = () => Promise<Queue>;

interface GlobalJobStore {
  [GLOBAL_QUEUE_STORE]?: QueueMap;
  [GLOBAL_LOG_FLAG]?: boolean;
}

const globalStore = globalThis as unknown as GlobalJobStore;

const QueueStore: QueueMap = 
  globalStore[GLOBAL_QUEUE_STORE] ?? 
  (globalStore[GLOBAL_QUEUE_STORE] = new Map<string, Queue>());

// Log once on initialization
if (!globalStore[GLOBAL_LOG_FLAG]) {
  globalStore[GLOBAL_LOG_FLAG] = true;
  console.log('[Jobs] QueueStore initialized');
}

/**
 * Internal helper to register a queue in the global store
 */
function registerQueue(name: string, queue: Queue): void {
  QueueStore.set(name, queue);
}

/**
 * Ensures a queue is initialized only once, using lazy initialization
 */
async function ensureQueue(name: string, setup: QueueSetupFunction): Promise<Queue> {
  const existing = QueueStore.get(name);
  if (existing) return existing;
  
  const queue = await setup();
  registerQueue(name, queue);
  return queue;
}

/**
 * Generic queue getter with proper error messaging
 */
function getQueue(queueName: string, queueType: string): Queue {
  const queue = QueueStore.get(queueName);
  if (!queue) {
    throw new Error(`${queueType} queue not initialized. Call setupAll*Jobs() first.`);
  }
  return queue;
}

// Public queue getters
export function getEmailQueue(): Queue {
  return getQueue(JobKeys.email.queueName, 'Email');
}

export function getGameDisconnectionQueue(): Queue {
  return getQueue(JobKeys.game_disconnect.queueName, 'Game disconnection');
}

export function getGameTimeoutQueue(): Queue {
  return getQueue(JobKeys.game_timeout.queueName, 'Game timeout');
}

/**
 * Initialize job queues required by the API server
 * Currently includes: Email jobs
 */
export async function setupAllAPIJobs(): Promise<void> {
  await ensureQueue(JobKeys.email.queueName, setupEmailJobSet);
}

/**
 * Initialize job queues required by the Socket server
 * Currently includes: Game disconnection, Game timeout
 */
export async function setupAllSocketJobs(): Promise<void> {
  await Promise.all([
    ensureQueue(JobKeys.game_disconnect.queueName, setupGameDisconnectJobSet),
    ensureQueue(JobKeys.game_timeout.queueName, setupGameTimeoutJobSet),
  ]);
}

/**
 * Initialize all job queues (both API and Socket)
 * Use this when both servers run in the same process or for shared jobs
 */
export async function setupAllJobs(): Promise<void> {
  await Promise.all([
    setupAllAPIJobs(),
    setupAllSocketJobs(),
  ]);
}

// Diagnostic exports
export const JobRegistry = {
  getEmailQueue,
  getGameDisconnectionQueue,
  getGameTimeoutQueue,
  getQueueCount: (): number => QueueStore.size,
  getAllQueueNames: (): readonly string[] => Array.from(QueueStore.keys()),
} as const;
