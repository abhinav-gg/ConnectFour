import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class VictorBot extends BotBase {
  // Matches `Victor` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440003";

  // async chooseMove(): Promise<Move> {
  //   const legalMoves = this.game.getLegalMoves();
    
  //   // Victor bot is competitive and uses strategic thinking
  //   // This implementation focuses on controlling the center and making strong positional plays
    
  //   const scores = this.evaluatePositions(legalMoves);
    
  //   // Find the best move(s)
  //   const maxScore = Math.max(...scores);
  //   const bestMoves = legalMoves.filter((_, index) => scores[index] === maxScore);
    
  //   // If multiple moves have the same score, prefer center positions
  //   if (bestMoves.length > 1) {
  //     const centerPreference = bestMoves.sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
  //     return centerPreference[0];
  //   }
    
  //   return bestMoves[0];
  // }

}