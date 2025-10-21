import { Move } from "@shared/types/game.types";
import { StandardGame } from "../../shared/utils/Games/game";
import { makeBotWithIDAndGame } from "../src/tools/Bots";

// Lightweight, informal bot tests. Run with ts-node or your project's test runner.
async function simulateBotGame() {
    console.log('Starting informal bot vs bot game simulation...');
    const game = new StandardGame("4543");
    const bot1 = makeBotWithIDAndGame("f8a2c4d6-1234-4567-8901-123456789abc", game); // RandomBot
    const bot2 = makeBotWithIDAndGame("550e8400-e29b-41d4-a716-446655440004", game); // AdaptiveBot

    let move: Move = -1;
    let turn = 0;
    while (!game.gameOver) {
      if (turn === 0) {
        move = await bot1.chooseMove();
      } else {
        move = await bot2.chooseMove();
      }
      game.makeMove(move);
      console.log(game.prettyPrintBoard(), `\nNext move by bot${turn + 1}: ${move}`);
      turn++;
      turn %= 2;
    }
}

// Run when executed directly
if (require.main === module) {
  simulateBotGame().catch(err => {
    console.error('Unexpected error while running bot tests:', err);
    process.exitCode = 1;
  });
}

export default simulateBotGame;
