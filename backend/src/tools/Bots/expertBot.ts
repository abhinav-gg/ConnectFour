import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class ExpertBot extends BotBase {
  public static id = "expert";

  async chooseMove(): Promise<Move> {
    const legalMoves = this.game.getLegalMoves();
    
    // Expert bot uses advanced heuristics
    // This is a simplified implementation - in a real scenario, this would use minimax with alpha-beta pruning
    
    // For now, implement a more sophisticated strategy than intermediate
    const scores = this.evaluateMoves(legalMoves);
    
    // Find the best scored move
    let bestScore = Math.max(...scores);
    const bestMoves = legalMoves.filter((_, index) => scores[index] === bestScore);
    
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  private evaluateMoves(legalMoves: Move[]): number[] {
    return legalMoves.map(move => {
      let score = 0;
      
      // Center columns are generally better
      if (move === 3) score += 3;
      else if (move === 2 || move === 4) score += 2;
      else if (move === 1 || move === 5) score += 1;
      
      // Add some randomness to avoid predictability
      score += Math.random() * 0.5;
      
      return score;
    });
  }

  reset(): void {
    console.log('ExpertBot has been reset.');
  }
}