// lib/jobs/sets/game.disconnection.ts
import { createJobSet } from '../utils/createJobSet';
import type { Queue } from 'bullmq';
import { liveGameService } from '@/services/livegame.service';
import { GameContext } from '@/utils/gameContext';
import { JobKeys } from '../jobKeys';

export async function setupGameDisconnectJobSet(): Promise<Queue> {
  const { queue } = await createJobSet({
    queueName: JobKeys.game_disconnect.queueName,
    processor: async (job) => {
      const { gameId, playerId } = job.data;
      // Logic to handle game disconnection
      const gameContext = await GameContext.fromGameId(playerId, gameId);
      await liveGameService.DisconnectPlayer(gameContext);
      return { success: true };
    },
    defaultJobOptions: {
      delay: 30000,
      removeOnComplete: 2, // Keep last 2 completed jobs instead of removing immediately
      removeOnFail: 2,    // Keep last 2 failed jobs
    },
  });

  return queue;
}

// Note: Getters are centralized in jobs/index.ts

