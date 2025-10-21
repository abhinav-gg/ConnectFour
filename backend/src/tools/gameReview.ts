import { COLS } from "@shared/constants/game.constants";
import { Game, MoveClassification } from "@shared/types/game.types";
import { SelfAnalysis } from "@shared/utils/analysis";
import { StandardGame } from "@shared/utils/Games/game";
import { getConnect4Solver, IConnect4Solver } from "@shared/WASM/con4Solver";


export class GameReview extends SelfAnalysis {

    private constructor(game: Game, solver: IConnect4Solver) {
        super(game, solver);
    }

    static async load(game: Game): Promise<GameReview> {
        const solver = await getConnect4Solver();
        return new GameReview(game, solver);
    }

    /* Classify a single move given the position string */
    Classify = (pos: string): MoveClassification => {

        let analysis = this.solver.analyzePosition(pos.slice(0, -1)).filter(x => Math.abs(x) !== 1000); // do not include last move
        console.log(pos, analysis);
        const col = parseInt(pos[pos.length - 1], 10) - 1;
        const red = pos.length % 2 === 0;
        if (red) analysis = analysis.map(x => -x); // invert analysis for yellow player (last move)
        
        // Available parameters to use for classification:
        
        const myChoice = analysis[col];
        const bestMove = Math.max(...analysis);
        const worstMove = Math.min(...analysis.filter(x => Math.abs(x) !== 1000)); // ignore -1000 (the instant loss move)
        
        const bestDiff = bestMove - myChoice;                           // How much worse was my move than the best    
        const worstDiff = myChoice - worstMove;                         // How much better was my move than the worst
        
        const mistakeDrawThreshold = 10;                                    // Threshold for classifying a mistake
        const mistakeLossThreshold = 13;                                    // Threshold for classifying a mistake
        const greatThreshold = 10;                                      // Threshold for classifying a great move
        const brilliantThreshold = 15;                                  // Threshold for classifying a brilliant move
        const blunderDrawThreshold = 5;                                     // Threshold for classifying a blunder move
        const blunderLossThreshold = 15;                                     // Threshold for classifying a blunder move
        
        const drawMade = myChoice === 0;                                // Made a drawing move
        const lossMade = myChoice < 0;                                  // Made a losing move
        const bestMade = myChoice === bestMove;                         // Made the best move
        const hadWinning = analysis.some(x => x > 0);                   // Had any winning move
        const hadDrawing = analysis.some(x => x === 0);                 // Had any drawing move       
        const onlyOneWinningMove = analysis.filter(x => x >= 0).length === 1;     // Had exactly one winning or drawing move (a "great" move)

        // Ignore openings:
        if (pos.length < 9) {
            return MoveClassification.BOOK;
        }

        const classificationRules: {
        condition: () => boolean,
        result: MoveClassification
        }[] = [

        // Great move detection (includes BRILLIANT, GREAT, BEST, MISS)
        {
            condition: () => onlyOneWinningMove && bestMade && myChoice > brilliantThreshold,
            result: MoveClassification.BRILLIANT,
        },
        {
            condition: () => onlyOneWinningMove && bestMade && myChoice > greatThreshold,
            result: MoveClassification.GREAT,
        },
        {
            condition: () => onlyOneWinningMove && bestMade,
            result: MoveClassification.BEST,
        },  
        {   // Could add a mistake threshold here if desired
            condition: () => onlyOneWinningMove && !bestMade,
            result: MoveClassification.MISS,
        },

        // Winning opportunities missed
        {
            condition: () => hadWinning && drawMade && bestDiff < blunderDrawThreshold,
            result: MoveClassification.BLUNDER,
        },
        {
            condition: () => hadWinning && lossMade && bestDiff < blunderLossThreshold,
            result: MoveClassification.BLUNDER,
        },
        {
            condition: () => hadWinning && (lossMade || drawMade),
            result: MoveClassification.MISTAKE,
        },

        // Winning position and winning move
        {
            condition: () => hadWinning && bestMade,
            result: MoveClassification.BEST,
        },
        {
            condition: () => hadWinning,
            result: MoveClassification.GOOD,
        },

        // Drawing opportunities missed
        {
            condition: () => hadDrawing && drawMade,
            result: MoveClassification.BEST,
        },
        {
            condition: () => hadDrawing && lossMade && worstDiff < mistakeDrawThreshold,
            result: MoveClassification.MISTAKE,
        },
        {
            condition: () => hadDrawing && lossMade,
            result: MoveClassification.BLUNDER,
        },

        // Losing positions – pick the best loss
        {
            condition: () => !hadWinning && !hadDrawing && bestMade,
            result: MoveClassification.BEST,
        },
        {
            condition: () => !hadWinning && !hadDrawing && worstDiff > mistakeLossThreshold,
            result: MoveClassification.MISTAKE,
        },
        {
            condition: () => !hadWinning && !hadDrawing,
            result: MoveClassification.GOOD,
        },
        ];

        for (const rule of classificationRules) {
            if (rule.condition()) {
                return rule.result as MoveClassification;
            }
        }
        return MoveClassification.UNCLASSIFIABLE; // Fallback (should not happen)
    }

    classifyAllMovesInGame (): Record<string, MoveClassification> {

        const classifications: Record<string, MoveClassification> = {};

        for (const stringToAnalyse of this.gameState.cumulativeMoves()) {
            if (!stringToAnalyse) continue; // skip empty strings
            const classification = this.Classify(stringToAnalyse);
            classifications[stringToAnalyse] = classification;
            console.log("Classified Move:", stringToAnalyse, "as", MoveClassification[classification]);
        }

        return classifications;
    }

    classifyAllNextMoveOptions (): Record<string, MoveClassification> {

        const classifications: Record<string, MoveClassification> = {};
        const pos = this.gameState.exportMoves();
        const legalMoves = this.gameState.getLegalMoves();
        for (let col = 0; col < COLS; col++) {
            const move = pos + col;
            if (!legalMoves.includes(col)) {
                classifications[move] = MoveClassification.UNCLASSIFIABLE;
                continue;
            }
            const classification = this.Classify(move);
            classifications[move] = classification;
        }

        return classifications;
    }


}