import { StandardGame } from "../../shared/utils/Games/game";
import { getAllBotIds, makeBotWithIDAndGame } from "../src/tools/Bots";

// Lightweight, informal bot tests. Run with ts-node or your project's test runner.
async function runBotTests() {
  console.log('Starting informal bot tests...');

  // Prepare a sample game position (a few moves played)
  const sampleMoves = '3344'; // small sequence, 1-based columns in original helpers but StandardGame expects zero-based when passed as string loader handles digits 1-7
  const game = new StandardGame(sampleMoves);

  const botIds = getAllBotIds();
  if (!botIds || botIds.length === 0) {
    console.warn('No bots found to test');
    return;
  }

  const results: { id: string; ok: boolean; reason?: string; move?: any }[] = [];

  // Test a subset (or all) bots — keep it quick by limiting to first 6
  const toTest = botIds.slice(0, 6);

  for (const id of toTest) {
    try {
      const gClone = new StandardGame(game.exportMoves()); // give each bot a fresh clone
      const bot = makeBotWithIDAndGame(id, gClone);
      // chooseMove should return a legal move (number) inside the available moves
      const move = await bot.chooseMove();

      const legal = gClone.getLegalMoves();
      const ok = typeof move === 'number' && legal.includes(move);

      results.push({ id, ok, move, reason: ok ? undefined : `move ${move} not in legal moves ${JSON.stringify(legal)}` });
      console.log(`Bot ${id} -> move: ${move} -> ${ok ? 'OK' : 'INVALID'}`);
    } catch (err: any) {
      results.push({ id, ok: false, reason: `threw: ${err?.message || err}` });
      console.error(`Bot ${id} threw an error:`, err);
    }
  }

  const failed = results.filter(r => !r.ok);
  if (failed.length === 0) {
    console.log('\nAll informal bot checks passed 🎉');
    process.exitCode = 0;
  } else {
    console.error(`\n${failed.length} bot(s) failed informal checks:`);
    for (const f of failed) console.error('-', f.id, f.reason, 'move:', f.move);
    process.exitCode = 2;
  }
}

// Run when executed directly
if (require.main === module) {
  runBotTests().catch(err => {
    console.error('Unexpected error while running bot tests:', err);
    process.exitCode = 1;
  });
}

export default runBotTests;
