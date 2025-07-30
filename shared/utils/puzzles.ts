import { Cell, Player } from "@shared/types/game";
import { StandardGame } from "./Games/game";
import { COLS, ROWS } from "@shared/constants/game";

export const examplePuzzles = [
    "45342133|4243543",
    "4435213533|246",
]

export type PuzzleSuccess = {
    succ: boolean,
    row1?: number,
    row2?: number,
    col1?: number,
    col2?: number,
}

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

    getBoard(): Cell[][] {
        return this.gameState.getBoard()
    }

    get getMyCol(): Player {
        return this.puzStr.length % 2 as Player;
    }

    attemptMove(col: number): PuzzleSuccess { // change return to string and bool pair later and use for calculation of score.
        if (col < 0 || col >= COLS) {
            throw new Error(`Invalid column number: ${col}`);
        }

        const ci = this.gameState.getMoves().length + 1
        let expected = this.puzStr[ci];

        if (expected !== (col + 1).toString()) {
            // wrong move
            return { succ: false };
        }

        const result = this.gameState.makeMove(col, false);
        if (ci === this.puzStr.length - 1) {
            //console.log("Puzzle completed successfully!");
            // terminate the puzzle here
            return { succ: true, row1: result.row, col1: col }
        } else {
            let nextMove = parseInt(this.puzStr[ci + 1], 10) - 1;
            const result2 = this.gameState.makeMove(nextMove, false); 
            return { succ: true, row1: result.row, col1: col, row2: result2.row, col2: nextMove }
        }
    }

}