import { StandardGame } from "@shared/utils/Games/game";
import { myConfig } from "../config/env";
import { calculateEloChanges, calculatePredictedScore, calculateUpdatedElo, getQueuePriority } from "@/utils/game";
import { SelfAnalysis } from "@shared/utils/analysis";
import { PUBLIC_BOTS } from "@/utils/tools/botHandler";
import { Move } from "@shared/types/game.types";
import { OpeningManager } from "@/utils/tools/opening-book";
import { getIdentity } from "@/utils/validation";
import { packGameInfo, unpackGameInfo } from "@/utils/binary";
import { TimedStandardGame } from "@shared/utils/Games/timed-game";
import { CategoriseTime } from "@shared/utils/gamemodes";
import { redisOps } from "@/redis/ops";
import { GameReview } from "@/utils/tools/gameReview";

console.log("This is an adhoc test file for backend tests.");

let boardTest = new StandardGame("4444413663256723312"); //63256723312

console.log(boardTest.prettyPrintBoard(), boardTest.hashCode);
// // boardTest.makeMove(3);

// // console.log(boardTest.prettyPrintBoard());

// // let testPuzzle = new Puzzle(examplePuzzles[0]);

// console.log(myConfig.CLIENT_URL, myConfig.RDS_PASSWORD, myConfig.CLIENT_URL.length);


// console.log(calculateEloChanges(1650, 1600, true));

// console.log(calculateEloChanges(1600, 1650, false));

// console.log(getIdentity("user:yesnt-noyes"));


(async () => {

console.log(boardTest.getAllWinningTrajectories());

// const review = await GameReview.load(boardTest);

// console.log(review.Analyze());


// console.log(review.getAverageAccuracy(0));

// for (let dElo = 0; dElo <= 100; dElo++) {
//     for (let dTime = 0; dTime < 1000000; dTime += 300) {
//         const priority = getQueuePriority(dTime, dElo);
//         if (priority >= 1) {
//             console.log(`Elo: ${dElo}, Time Difference: ${dTime / 1000}`);
//             break;
//         }
//     }
// }
// let prev = "nothing";
// for (let bT = 0; bT <= 30; bT++) {
//     for (let bInc = 0; bInc < 128; bInc += 1) {
//         for (let bDis = 0; bDis < 128; bDis += 1) {
//             const tc = {
//                 base_time: bT,
//                 increment: bInc,
//                 disadvantage: bDis
//             };
//             try {
//                 const TimeCategory = CategoriseTime(tc);
//                 if (prev === TimeCategory) continue; // Skip duplicates
//                 console.log(`Base Time: ${bT}, Increment: ${bInc}, Disadvantage: ${bDis}, Category: ${TimeCategory}`);
//                 prev = TimeCategory; // Update previous category
//             } catch (error) {
//                 continue; // Skip invalid time controls
//             }
//         }
//     }
// }

})();

// Test for Timed Game Logic
(async () => {
  console.log("Timed Game Tests Starting...");


    



  // Initialize a timed game with base time and increment
//   const timedGame = new TimedStandardGame({
//     gamemode: 10,
//     time_control: {
//         base_time: 6,
//         increment: 2,   // 5 seconds per move
//         disadvantage: 3 // 3 seconds disadvantage for player 2
//     }
//   });

//   console.log("Initial Time:", timedGame.getTimeLeft());

//   // Simulate moves and check time decrement
//   timedGame.makeMove(3);
//   console.log("After Red's Move:", timedGame.getTimeLeft());

//   timedGame.makeMove(4);
//   console.log("After Yellow's Move:", timedGame.getTimeLeft());

//   // Simulate a timeout scenario of 5 seconds with a timeout
//   await new Promise(resolve => setTimeout(resolve, 5000));
//   // Verify increment behavior
//   timedGame.makeMove(5);
//   console.log("After Red's Move with Increment:", timedGame.getTimeLeft());

//   timedGame.prettyPrintBoard();
})();




