import { Move } from '@shared/types/game.types';
import { BotBase } from './bot';
import { GameReview } from '../gameReview';

export class PerfectBot extends BotBase {
  // No explicit Perfect entry in shared/constants/botinfo.ts — keep a stable UUID for PerfectBot
  public static id = "f8a2c4d6-1234-4567-8901-123456789abc"; // Perfect Solver
  
  async chooseMove(): Promise<Move> {
    if (!this.solver) {
      this.solver = await GameReview.load(this.game as any);
    }
    const moveRanks = this.solver.Analyze();
    const bestMove = Math.max(...moveRanks);
    return moveRanks.indexOf(bestMove) as Move;
  }
  
}