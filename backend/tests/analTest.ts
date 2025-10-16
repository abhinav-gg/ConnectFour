import { Move } from "@shared/types/game.types";
import { StandardGame } from "../../shared/utils/Games/game";
import { SelfAnalysis } from "@shared/utils/analysis";
import { GameReview } from "@/tools/gameReview";

async function analSimulations() {
    console.log('Starting informal bot vs bot game simulation...');
    const game = new StandardGame("4543265321");
    const gr = await GameReview.load(game);
    console.log(game.prettyPrintBoard());
    console.log(gr.classifyAllNextMoveOptions());
}

// Run when executed directly
if (require.main === module) {
  analSimulations().catch(err => {
    console.error('Unexpected error while running bot tests:', err);
    process.exitCode = 1;
  });
}

export default analSimulations;
