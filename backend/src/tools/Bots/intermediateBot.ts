import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class IntermediateBot extends BotBase {
  // Matches `Intermediate` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440005";

  // async chooseMove(): Promise<Move> {
  //   const legalMoves = this.game.getLegalMoves();
    
    
  // }

  reset(): void {
    console.log('IntermediateBot has been reset.');
  }
}