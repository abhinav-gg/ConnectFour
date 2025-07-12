import { StandardGame } from "./game";
import { COLS, ROWS } from "@shared/constants";

export const examplePuzzles = [
    "45342133|4243543",
    "4435213533|246",
] 


export class Puzzle {
    
    puzStr: string;
    private gameState: StandardGame; 

    constructor(puzStr: string) {

        // Consider binary in very distant future

        this.puzStr = puzStr;
        this.gameState = new StandardGame();

        // Validate the puzzle string is only digits and pipes, and has a valid length (COLS * ROWS + 1)
        if (!/^[1-COLS|]+$/.test(puzStr) || puzStr.length > (COLS * ROWS + 1)) {
            throw new Error('Invalid puzzle string.');
        }

        // ai proposition:
        // for each col in the string, construct up until the |
        const parts = puzStr.split('|');
        if (parts.length !== 2) {
            throw new Error('Puzzle string must contain exactly one pipe character.');
        }
        else if (parts[1].length % 2 !== 1) {
            throw new Error('Puzzle string after pipe must have an ODD number of digits.');
        }

        const movesPart = parts[0];
        for (let i = 0; i < movesPart.length; i++) {
            const col = parseInt(movesPart[i], 10) - 1; // Convert to 0-based index
            if (col < 0 || col >= COLS) {
                throw new Error(`Invalid column number: ${movesPart[i]}`);
            }
            this.gameState.makeMove(col, true); // Silent mode to avoid event emission
        }
    }

    prettyPrintBoard(): string {
        return this.gameState.prettyPrintBoard();
    }


    attemptMove(col: number): boolean { // change return to string and bool pair later and use for calculation of score.
        if (col < 0 || col >= COLS) {
            throw new Error(`Invalid column number: ${col}`);
        }

        const ci = this.gameState.getMoves().length + 1
        let expected = this.puzStr[ci];

        if (expected !== (col + 1).toString()) {
            // wrong move
            return false;
        }

        const result = this.gameState.makeMove(col, false);
        if (ci === this.puzStr.length - 1) {
            //console.log("Puzzle completed successfully!");
            // terminate the puzzle here
            return true
        } else {
            let nextMove = parseInt(this.puzStr[ci + 1], 10) - 1;
            this.gameState.makeMove(nextMove, false); // Silent mode to avoid event emission
        }
        return result.success;
    }

}