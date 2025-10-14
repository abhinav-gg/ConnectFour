import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class IntermediateBot extends BotBase {
  // Matches `Intermediate` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440005";

  async chooseMove(): Promise<Move> {
    const legalMoves = this.game.getLegalMoves();
    
    // Intermediate bot uses basic strategy
    // Priority: 1) Win immediately, 2) Block opponent win, 3) Play center, 4) Random
    
    // For now, implement a simple strategy - prefer center columns and avoid edges
    const centerMoves = legalMoves.filter(move => move >= 1 && move <= 5);
    const edgeMoves = legalMoves.filter(move => move === 0 || move === 6);
    
    // 70% chance to play center columns if available
    if (centerMoves.length > 0 && Math.random() < 0.7) {
      // Prefer actual center (column 3)
      if (centerMoves.includes(3)) {
        return 3;
      }
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
    
    // Otherwise play any legal move
    const index = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[index];
  }

  reset(): void {
    console.log('IntermediateBot has been reset.');
  }
}