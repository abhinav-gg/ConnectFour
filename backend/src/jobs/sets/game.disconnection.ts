// lib/jobs/sets/game.disconnection.ts
import { createJobSet } from '../jobset/createJobSet';
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
      removeOnComplete: 5, // Keep last 5 completed jobs instead of removing immediately
      removeOnFail: 10,    // Keep last 10 failed jobs
    },
  });

  return queue;
}

// Note: Getters are centralized in jobs/index.ts

