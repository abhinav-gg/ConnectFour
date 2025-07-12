import { StandardGame } from "@shared/utils/game";
import { Puzzle, examplePuzzles } from "@shared/utils/puzzles";
import { myConfig } from "../config/env";
import { getRedisClient } from "../src/redis/redis";

console.log("This is an adhoc test file for backend tests.");

let boardTest = new StandardGame("33523");

console.log(boardTest.prettyPrintBoard(), boardTest.hashCode);
// boardTest.makeMove(3);

// console.log(boardTest.prettyPrintBoard());

// let testPuzzle = new Puzzle(examplePuzzles[0]);

console.log(myConfig.CLIENT_URL, myConfig.DB_PASSWORD, myConfig.CLIENT_URL.length);




