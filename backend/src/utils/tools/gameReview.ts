import { MoveClassification } from "@shared/constants/game.constants";
import { SelfAnalysis } from "@shared/utils/analysis";
import { StandardGame } from "@shared/utils/Games/game";
import { getConnect4Solver, IConnect4Solver } from "@shared/WASM/con4Solver";


export class GameReview extends SelfAnalysis {

    private constructor(game: StandardGame, solver: IConnect4Solver) {
        super(game, solver);
    }

    static async load(game: StandardGame): Promise<GameReview> {
        const solver = await getConnect4Solver();
        return new GameReview(game, solver);
    }

    Classify = (pos: string, analysis: number[]): MoveClassification => {

        const col = parseInt(pos[pos.length - 1], 10) - 1;
        const red = pos.length % 2 === 0;
        if (red) analysis = analysis.map(x => -x); // invert analysis for yellow player (last move)
        const myChoice = analysis[col];
        const hadWinning = analysis.some(x => x > 0);
        const hadDrawing = analysis.some(x => x === 0);
        const bestMove = Math.max(...analysis);
        const worstMove = Math.min(...analysis.filter(x => Math.abs(x) !== 1000)); // ignore -1000 (the instant loss move)
        const bestDiff = bestMove - myChoice;
        const worstDiff = myChoice - worstMove;
        const hadGreat = analysis.filter(x => x >= 0).length === 1;
        // console.log(analysis, "isRed:", red, "myChoice:", myChoice, "bestMove:", bestMove, "worstMove:", worstMove, "bestDiff:", bestDiff, "worstDiff:", worstDiff, "hadGreat:", hadGreat);

        // add proper opening book check here
        if (pos.length < 9) {
            return MoveClassification.BOOK;
        }

        if (hadGreat) {
            if (myChoice === bestMove) {
                if (worstDiff > 20) {
                    return MoveClassification.BRILLIANT;
                } else if (worstDiff > 10) {
                    return MoveClassification.GREAT;
                } else {
                    return MoveClassification.BEST;
                }
            } else {
                return MoveClassification.MISS;
            }
        }

        if (hadWinning) {
            if (myChoice === 0) {
                if (myChoice > 5) {
                    return MoveClassification.MISTAKE;
                } else {
                    return MoveClassification.BLUNDER;
                }
            } else if (myChoice < 0) {
                if (bestDiff > 10) {
                    return MoveClassification.MISTAKE;
                } else {
                    return MoveClassification.BLUNDER;
                }
            } else {
                if (myChoice === bestMove) {
                    return MoveClassification.BEST;
                } else {
                    return MoveClassification.GOOD;
                }
            }
        } else if (hadDrawing) {
            // best move is 0, so we can classify it as a best move
            if (myChoice === 0) {
                return MoveClassification.BEST;
            } else if (myChoice < 0) {
                if (bestDiff > 10) {
                    return MoveClassification.MISTAKE;
                } else {
                    return MoveClassification.BLUNDER;
                }
            } else { throw new Error ("unreachable code reached"); }
        } else {
            // all moves are negative so we classify the move based on bestDiff
            if (myChoice === bestMove) {
                return MoveClassification.BEST;
            } else if (bestDiff > 10) {
                return MoveClassification.MISTAKE;
            } else {
                return MoveClassification.GOOD;
            }
        }
    }

    classifyMoves (): Record<string, MoveClassification> {

        const classifications: Record<string, MoveClassification> = {};

        for (const stringToAnalyse of this.gameState.cumulativeMoves()) {
            if (!stringToAnalyse) continue; // skip empty strings
            const analysis = this.solver.analyzePosition(stringToAnalyse.slice(0, -1)); // do not include last move
            const classification = this.Classify(stringToAnalyse, analysis);
            classifications[stringToAnalyse] = classification;
            console.log("Classified Move:", stringToAnalyse, "as", MoveClassification[classification]);
        }

        return classifications;
    }
}