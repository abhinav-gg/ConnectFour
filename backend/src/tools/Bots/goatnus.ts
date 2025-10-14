import { Move } from '@shared/types/game.types';
import { SelfAnalysis } from '@shared/utils/analysis';
import { BotBase } from './bot';
import { Game } from '@shared/types/game.types';

export class GoatnusBot extends BotBase {
  // Matches `Magnus Goatson` (aka Goatnus) entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440006";

  constructor(game: Game) {
    super(game);
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

}