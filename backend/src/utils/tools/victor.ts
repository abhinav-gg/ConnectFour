
// import { GameState } from "./game";
// import { AnalysisProps } from "./analysis";
// import { Cell, Player } from "@shared/Types/gameData";

// type Board = Cell[][];

// export class bestAnalysis {
//     gameState: GameState
//     results: AnalysisProps
//     GS = new GameState()
//     board = this.GS.getBoard()

//     constructor(gameState: GameState) {
//         this.gameState = gameState
//         this.results = { evaluation: 0, explanation: 'Begin Game', alternativeMoves: [] }
//     }

//     Claimeven() {
//         const board = this.GS.getBoard();
//         // Required: Two squares, directly above each other. Both squares should be empty. The upper square must be even.
//         // Solutions: All groups which contain the upper square.

//        // in english: controller of zugzwang can claim all even squares that are not already accessible
//         //            after simulating this, if white has even threats and black has odd threats the game will draw
//     }

//     Vertical() {

//     }
    
//     getBestMove(
//         board: Board,
//         currentPlayer: Player): number {
//         this.GS.setBoard(board, true)
//         this.GS.checkGameOver()

//         if (this.GS.gameOver) {
//             return 0
//         }

//         const player = currentPlayer === 1 ? 1 : 2
//         const opponent = player === 1 ? 2 : 1

//         // Claimeven

//         // Baseinverse

//         // Vertical

//         // Aftereven

//         // Lowinverse

//         // Highinverse

//         // Baseclaim

//         // Before

//         // Specialbefore

//         // No moves found
//         return 0
//     }
// }

// /**
//  * Definitions:
//  * - group: a position of 4 connected squares which could be used by the opponent to connect four of their pieces
//  * - opponent: the opponent of the player who currently controls the Zugzwang
//  */