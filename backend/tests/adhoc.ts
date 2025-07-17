import { StandardGame } from "@shared/utils/game";
import { myConfig } from "../config/env";
import { calculateEloChanges, calculatePredictedScore, calculateUpdatedElo } from "@/utils/game";

console.log("This is an adhoc test file for backend tests.");

let boardTest = new StandardGame("33523");

console.log(boardTest.prettyPrintBoard(), boardTest.hashCode);
// boardTest.makeMove(3);

// console.log(boardTest.prettyPrintBoard());

// let testPuzzle = new Puzzle(examplePuzzles[0]);

console.log(myConfig.CLIENT_URL, myConfig.RDS_PASSWORD, myConfig.CLIENT_URL.length);


console.log(calculateEloChanges(1650, 1600, true));

console.log(calculateEloChanges(1600, 1650, false));
