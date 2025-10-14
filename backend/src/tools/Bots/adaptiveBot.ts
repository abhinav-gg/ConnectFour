import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class AdaptiveBot extends BotBase {
  // Matches `Adaptive` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440001";
  private opponentMoveHistory: Move[] = [];

  async chooseMove(): Promise<Move> {
    const legalMoves = this.game.getLegalMoves();
    
    // Track opponent's move patterns
    this.updateOpponentHistory();
    
    // Adaptive strategy: Mirror opponent's style or counter it
    if (this.opponentMoveHistory.length >= 2) {
      return this.adaptToOpponent(legalMoves);
    }
    
    // Early game: prefer center
    const centerCol = 3;
    if (legalMoves.includes(centerCol)) {
      return centerCol;
    }
    
    // Fallback to random
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  private updateOpponentHistory(): void {
    const moves = this.game.getMoves();
    // Get opponent moves (every other move, starting from move 0 if we're player 2, or move 1 if we're player 1)
    this.opponentMoveHistory = moves
      .filter((_, index) => index % 2 === 0); // Assuming opponent is player 1 (first to move)
  }

  private adaptToOpponent(legalMoves: Move[]): Move {
    // Simple adaptation: if opponent likes center, we compete for it
    // If opponent likes edges, we take center
    const recentMoves = this.opponentMoveHistory.slice(-3);
    const opponentLikesCenter = recentMoves.filter(move => move >= 2 && move <= 4).length > recentMoves.length / 2;
    
    if (opponentLikesCenter) {
      // Compete for center area
      const centerMoves = legalMoves.filter(move => move >= 2 && move <= 4);
      if (centerMoves.length > 0) {
        return centerMoves[Math.floor(Math.random() * centerMoves.length)];
      }
    } else {
      // Take center if opponent avoids it
      if (legalMoves.includes(3)) return 3;
    }
    
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  reset(): void {
    this.opponentMoveHistory = [];
    console.log('AdaptiveBot has been reset.');
  }
}
