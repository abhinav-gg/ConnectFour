import { BotBase } from './bot';

export class RandomBot extends BotBase {
  // Matches `Random` entry in shared/constants/botinfo.ts
  public static id = "550e8400-e29b-41d4-a716-446655440000";

  async chooseMove() {
    const legalMoves = this.game.getLegalMoves();
    const index = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[index];
  }

  reset(): void {
    console.log('RandomBot has been reset.');
  }
}