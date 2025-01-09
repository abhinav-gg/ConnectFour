import * as game from './game';

const examplePuzzles = [
    "4433(215)(526)",
    "453421334243543(212)(122)",
    "4435213533246(445567(3)(2))",
] 


export class Puzzle {
    
    puzStr: String;
    gameState: game.GameState;

    constructor(puzStr: String) {
        this.puzStr = puzStr;
        this.gameState = new game.GameState();


        // ai proposition:
        for (let i = 0; i < this.puzStr.length; i++) {
            if (this.puzStr[i] === '(') {
                let j = i + 1;
                let puzStr = '';
                while (this.puzStr[j] !== ')') {
                    puzStr += this.puzStr[j];
                    j++;
                }
                i = j;
            }
            this.gameState.makeMove(parseInt(this.puzStr[i]));
        }
    }



}