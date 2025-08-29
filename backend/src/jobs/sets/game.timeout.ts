
// lib/jobs/sets/game.disconnection.ts
import { createJobSet } from '../utils/createJobSet';
import type { Queue } from 'bullmq';
import { liveGameService } from '@/services/livegame.service';
import { GameContext } from '@/utils/gameContext';
import { JobKeys } from '../jobKeys';

export async function setupGameTimeoutJobSet(): Promise<Queue> {
  const { queue } = await createJobSet({
    queueName: JobKeys.game_timeout.queueName,
    processor: async (job) => {
      
      
        const { userId, gameId } = job.data;
        try {

            // Create fresh GameContext at socket level
            const gameContext = await GameContext.fromGameId(userId, gameId);
            await liveGameService.checkGameHealth(gameContext);

        } catch (error) {
            console.error('Error handling game enquiry:', error);
        }

    },
    defaultJobOptions: {
      removeOnComplete: 5, // Keep last 5 completed jobs instead of removing immediately
      removeOnFail: 10,    // Keep last 10 failed jobs
    },
  });

  return queue;
}

// Note: Getters are centralized in jobs/index.ts



