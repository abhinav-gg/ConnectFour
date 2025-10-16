import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';
import { GameReview } from '../gameReview';

export class ExpertBot extends BotBase {
  // Matches `Expert (pro)` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440002";

  async chooseMove(): Promise<Move> {

    const legalMoves = this.game.getLegalMoves();
    
    if (!this.solver) {
      this.solver = await GameReview.load(this.game as any);
    } 

    const move = 1//this.solver.;
    return move;
  }

  reset(): void {
    console.log('ExpertBot has been reset.');
  }
}