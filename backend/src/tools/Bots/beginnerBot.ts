import { GameReview } from '../gameReview';
import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class BeginnerBot extends BotBase {
  // Matches `Beginner` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440004";

  async chooseMove(): Promise<Move> {
    const legalMoves = this.game.getLegalMoves();

    if (!this.solver) {
      this.solver = await GameReview.load(this.game);
    }

    const MoveClassifications = this.solver?.classifyAllNextMoveOptions();
    console.log("MoveClassifications BEGINNER:", MoveClassifications);

    return legalMoves[0];


  }

  reset(): void {
    console.log('BeginnerBot has been reset.');
  }
}