// lib/jobs/sets/email.ts
import { createJobSet } from '../createJobSet';
import { sendEmail } from '@/lib/email/emails';
import type { Queue } from 'bullmq';

let gameQueue: Queue | undefined;

export async function setupGameDisconnectJobSet() {
  const { queue } = await createJobSet({
    queueName: 'gameDisconnectQueue',
    processor: async (job) => {
      
        

        const { gameId, playerId } = job.data;
        // Logic to handle game disconnection, e.g., notify players, update game state
        console.log(`Processing game disconnection timeout for gameId: ${gameId}, playerId: ${playerId}`);
        // You can add more logic here as needed






    }, // add default 30second delay to all jobs
    defaultJobOptions: {
      delay: 30000,
    },
  });

  gameQueue = queue;
}

export function getGameQueue(): Queue {
  if (!gameQueue) {
    throw new Error('Game queue not initialized. Call setupGameDisconnectJobSet() first.');
  }
  return gameQueue;
}

