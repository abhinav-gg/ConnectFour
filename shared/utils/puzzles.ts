import * as game from './game';

const examplePuzzles = [
    "4433",
    "453421334243543",
    "4435213533246",
] 


export class Puzzle {
    
    puzStr: string;
    gameState: game.GameState;

    constructor(puzStr: string) {
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