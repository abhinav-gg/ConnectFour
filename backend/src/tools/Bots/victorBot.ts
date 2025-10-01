import { BotBase } from './bot';
import { Move } from '@shared/types/game.types';

export class VictorBot extends BotBase {
  public static id = "victor";

  async chooseMove(): Promise<Move> {
    const legalMoves = this.game.getLegalMoves();
    
    // Victor bot is competitive and uses strategic thinking
    // This implementation focuses on controlling the center and making strong positional plays
    
    const scores = this.evaluatePositions(legalMoves);
    
    // Find the best move(s)
    const maxScore = Math.max(...scores);
    const bestMoves = legalMoves.filter((_, index) => scores[index] === maxScore);
    
    // If multiple moves have the same score, prefer center positions
    if (bestMoves.length > 1) {
      const centerPreference = bestMoves.sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
      return centerPreference[0];
    }
    
    return bestMoves[0];
  }

  private evaluatePositions(legalMoves: Move[]): number[] {
    return legalMoves.map(move => {
      let score = 0;
      
      // Strong preference for center control
      const centerDistance = Math.abs(3 - move);
      score += (3 - centerDistance) * 2;
      
      // Avoid edge columns unless necessary
      if (move === 0 || move === 6) score -= 1;
      
      // Add strategic evaluation based on game state
      score += this.evaluateStrategicValue(move);
      
      return score;
    });
  }

  private evaluateStrategicValue(move: Move): number {
    // Placeholder for more advanced strategic evaluation
    // This could analyze potential threats, opportunities, etc.
    
    // For now, just add some variance to make the bot less predictable
    return Math.random() * 0.3;
  }

  reset(): void {
    console.log('VictorBot has been reset.');
  }
}