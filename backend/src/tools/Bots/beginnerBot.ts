import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class BeginnerBot extends BotBase {
  // Matches `Beginner` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440004";

  async chooseMove(): Promise<Move> {
    const legalMoves = this.game.getLegalMoves();
    
    // Beginner bot makes mostly random moves but occasionally looks for simple wins/blocks
    const random = Math.random();
    
    // 20% chance to look for immediate wins or blocks
    if (random < 0.2) {
      // Simple heuristic: try center columns first
      const centerMoves = legalMoves.filter(move => move >= 2 && move <= 4);
      if (centerMoves.length > 0) {
        return centerMoves[Math.floor(Math.random() * centerMoves.length)];
      }
    }
    
    // Otherwise, play randomly
    const index = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[index];
  }

  reset(): void {
    console.log('BeginnerBot has been reset.');
  }
}