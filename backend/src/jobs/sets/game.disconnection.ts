// lib/jobs/sets/email.ts
import { getSocketIO } from '@/controllers/socket';
import { createJobSet } from '../createJobSet';
import { sendEmail } from '@/lib/email/emails';
import { redisOps } from '@/redis/ops';
import type { Queue } from 'bullmq';
import { RoomSchema } from '@/controllers/socket/socketRoomSchema';
import { gameService } from '@/services/game.service';
import { liveGameService } from '@/services/livegame.service';

let gameQueue: Queue | undefined;

export async function setupGameDisconnectJobSet() {
  const { queue } = await createJobSet({
    queueName: 'gameDisconnectQueue',
    processor: async (job) => {
      
        

        const { gameId, playerId } = job.data;
        // Logic to handle game disconnection, e.g., notify players, update game state
        console.log(`Processing game disconnection timeout for gameId: ${gameId}, playerId: ${playerId}`);
        // You can add more logic here as needed
        const r = await redisOps();
        const isConnected = await liveGameService.isPlayerSocketConnected(playerId);
        if (isConnected) {
          // The player has reconnected, so we can skip the disconnection logic
          console.log(`Player ${playerId} has reconnected, skipping disconnection logic.`);
          return;
        }

        // We can end the game by disconnecting the player


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

