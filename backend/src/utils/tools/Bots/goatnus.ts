import { Move } from '@shared/types/game';
import { SelfAnalysis } from '@shared/utils/analysis';
import { BotBase } from '@shared/utils/Bots';
import { StandardGame } from '@shared/utils/Games/game';

export class PerfectBot extends BotBase<StandardGame, Move> {
  private solver: SelfAnalysis | null = null;

  constructor(game: StandardGame) {
    super(game);
    this.solver = null;
  }

  async chooseMove(): Promise<Move> {
    // Only load the solver if it hasn't been loaded yet
    if (!this.solver) {
      this.solver = await SelfAnalysis.load(this.game);
    }

    let moveAnal = this.solver.Analyze()

    if (this.game.currentPlayer === 1){
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