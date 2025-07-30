import { StandardGame } from "@shared/utils/Games/game";
import { myConfig } from "../config/env";
import { calculateEloChanges, calculatePredictedScore, calculateUpdatedElo } from "@/utils/game";
import { SelfAnalysis } from "@shared/utils/analysis";
import { PUBLIC_BOTS } from "@shared/utils/botHandler";
import { Move } from "@shared/types/game";
import { OpeningManager } from "@/utils/opening-book";
import { getIdentity } from "@/utils/validation";
import { packGameInfo, unpackGameInfo } from "@/utils/binary";

console.log("This is an adhoc test file for backend tests.");

let boardTest = new StandardGame("5");

console.log(boardTest.prettyPrintBoard(), boardTest.hashCode);
// // boardTest.makeMove(3);

// // console.log(boardTest.prettyPrintBoard());

// // let testPuzzle = new Puzzle(examplePuzzles[0]);

// console.log(myConfig.CLIENT_URL, myConfig.RDS_PASSWORD, myConfig.CLIENT_URL.length);


// console.log(calculateEloChanges(1650, 1600, true));

// console.log(calculateEloChanges(1600, 1650, false));

// console.log(getIdentity("user:yesnt-noyes"));

const packed = packGameInfo(1012847, {
    base_time: 120,
    increment: 5,
    disadvantage: 3
});

console.log(packed, packed.length);

console.log(unpackGameInfo(packed));

(async () => {

console.log("starting")
// let selfAnal = await SelfAnalysis.load(boardTest);

// console.log(selfAnal.finalAnalysis())


// selfAnal.printAllEval()
// const bot = new PUBLIC_BOTS.perfect(boardTest)

// await OpeningManager.initStore()

// console.log(OpeningManager.getOpening(BigInt(2)), OpeningManager.getOpening(BigInt(1)));

// await OpeningManager.setOpening(BigInt(2), "#Hello Eartg");

// await OpeningManager.setOpening(BigInt(1), "#Hello Earth");

// console.log(OpeningManager.getOpening(BigInt(2)), OpeningManager.getOpening(BigInt(1)));

})();




