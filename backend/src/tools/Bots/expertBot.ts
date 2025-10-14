import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class ExpertBot extends BotBase {
  // Matches `Expert (pro)` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440002";

  async chooseMove(): Promise<Move> {
    return 0; // Always choose the first column
  }

  reset(): void {
    console.log('ExpertBot has been reset.');
  }
}