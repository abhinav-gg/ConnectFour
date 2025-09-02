import { BotBase } from './bot';

export class AdaptiveBot extends BotBase {
  public static id = "adaptive";

  async chooseMove() {
    const legalMoves = this.game.getLegalMoves();
    
    return 0;
  }

  reset(): void {
    console.log('AdaptiveBot has been reset.');
  }
}
