import { Move } from '@shared/types/game.types';
import { BotBase } from './bot';
import { Game } from '@shared/types/game.types';
import { SelfAnalysis } from '@shared/utils/analysis';

export class PerfectBot extends BotBase {
  public static id = "f8a2c4d6-1234-4567-8901-123456789abc"; // Perfect Solver
  private solver: SelfAnalysis | null = null;

  constructor(game: Game) {
    super(game);
    this.solver = null;
  }

  async chooseMove(): Promise<Move> {
    // Only load the solver if it hasn't been loaded yet
    if (!this.solver) {
      this.solver = await SelfAnalysis.load(this.game as any);
    }

    let moveAnal = this.solver.Analyze()

    if ((this.game as any).currentPlayer === 1){
      moveAnal = moveAnal.map(i => (-i));
    }

    const moves = this.solver.sortedBestMoves(moveAnal);

    // Return the first move found in the sorted moves
    for (const group of moves) {
      for (const move of group) {
        return move;  
      }
    }
    
    throw new Error("failed to find a move???")
  }

  reset(): void {
    this.solver = null;
  }
}