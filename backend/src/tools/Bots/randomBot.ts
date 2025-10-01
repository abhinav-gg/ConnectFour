import { BotBase } from './bot';

export class RandomBot extends BotBase {
  public static id = "random";

  async chooseMove() {
    const legalMoves = this.game.getLegalMoves();
    console.log(legalMoves, this.game);
    const index = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[index];
  }

  reset(): void {
    console.log('RandomBot has been reset.');
  }
}