// import { Cell, Player } from '@shared/Types/gameData'
// import { StandardGame } from './game'
// import { ROWS, COLS } from '@shared/constants'

// const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6] // Center-first column ordering to optimize minmax

// const MAXDEPTH = 32; 

// class HelperGameState extends StandardGame {

//   // allow for move undoing and other amenities

//   undoMove() {
//     if (this.currentMoveIndex < 0) {
//       throw new Error("No moves to undo");
//     }
//     const lastMove = this.moves.pop()!;
    
//     this.gameOver = false;
//     this.winner = null;
    
//     let targetRow = this.getAvailableRow(lastMove.col) + 1;
//     if (targetRow == ROWS) {
//       throw new Error("Invalid undid of the undo");
//     }
    
//     this.board[targetRow][lastMove.col] = null;
//     this.currentPlayer = lastMove.player;
//     this.currentMoveIndex = this.moves.length - 1; 
//   }
// }

// class LRUCache<K, V> {
//   private cache: Map<K, V>;
//   private maxSize: number;

//   constructor(maxSize: number) {
//     if (maxSize <= 0) throw new Error("maxSize must be greater than 0");
//     this.cache = new Map<K, V>();
//     this.maxSize = maxSize;
//   }

//   get(key: K): V | undefined {
//     if (!this.cache.has(key)) return undefined;
//     const value = this.cache.get(key)!;
    
//     // Refresh the key: remove and re-insert to update order
//     this.cache.delete(key);
//     this.cache.set(key, value);
    
//     return value;
//   }

//   set(key: K, value: V): void {
//     if (this.cache.has(key)) {
//       this.cache.delete(key); // Remove to re-insert at end (most recently used)
//     } else if (this.cache.size >= this.maxSize) {
//       // Remove least recently used (first inserted item)
//       const lruKey = this.cache.keys().next().value!;
//       this.cache.delete(lruKey);
//     }

//     this.cache.set(key, value);
//   }

//   delete(key: K): boolean {
//     return this.cache.delete(key);
//   }

//   clear(): void {
//     this.cache.clear();
//   }

//   has(key: K): boolean {
//     return this.cache.has(key);
//   }

//   size(): number {
//     return this.cache.size;
//   }

//   keys(): IterableIterator<K> {
//     return this.cache.keys();
//   }

//   values(): IterableIterator<V> {
//     return this.cache.values();
//   }

//   entries(): IterableIterator<[K, V]> {
//     return this.cache.entries();
//   }
// }


// export class Analysis {
//   gameState: HelperGameState
//   cache = new LRUCache<bigint, number>(5000000);
//   bestMove: number = -1;
  
//   constructor(gameState: StandardGame) {

//     //clone the game so that there are no issues
//     let moves = gameState.getMoves()
//     this.gameState = new HelperGameState(moves)

//   }

//   /**
//    * Performs a minimax search with alpha-beta pruning to evaluate the game state.
//    * @param alpha - The best score that the maximizing player can guarantee at that level or above.
//    * @param beta - The best score that the minimizing player can guarantee at that level or above.
//    * @return A number representing the evaluation: -50 for Player 1 win, 50 for Player 0 win, 0 for draw
//    */
//   minimax(
//     player: Player = this.gameState.currentPlayer,
//     depth: number = 0,
//     alpha: number = -50,
//     beta: number = 50
//   ): number {

//     // console.log("Minimax called with player:", player, "depth:", depth, this.gameState.prettyPrintBoard());
//     let myCurrentState = this.gameState.hashCode;

//     if (this.gameState.currentPlayer !== player) {
//       console.log(this.gameState.prettyPrintBoard(), player, depth, alpha, beta);
//       throw new Error("Player mismatch in minimax function");
//     }

//     if (this.cache.has(myCurrentState)) {
//       return this.cache.get(myCurrentState)!;
//     } else if (this.gameState.gameOver || depth >= MAXDEPTH) {
      
//       this.cache.set(myCurrentState, 0);
//       return 0;
//     }

//     let bestEval: number = player === 0 ? -50 : 50; // Assume worst case for current player
//     let bestMove: number = -1;

//     for (const col of MOVE_ORDER) {
//       // Optimization: check for all M1 moves first

//       let moveMade = this.gameState.makeMove(col, true);
//       if (!moveMade.success) continue; // Skip if the move is invalid

//       if (this.gameState.gameOver && this.gameState.winner === player) {

//         const evaluation = player === 0 ? 50 - depth : -50 + depth;
//         this.gameState.undoMove(); // Undo the move for the next iteration
//         if (depth === 0) {
//           this.bestMove = col; // Mate is always the best move
//         }
//         this.cache.set(myCurrentState, evaluation);
//         return evaluation; // Return immediately if we found a winning move
        
//       } else {
//         this.gameState.undoMove(); // Undo the move for the next iteration
//       }
//     }

//     // No M1 so run the minmax algorithm
    
//     for (const col of MOVE_ORDER) {
//       if (player === 0) {
//         let moveMade = this.gameState.makeMove(col)
//         if (!moveMade.success) {
//           continue; // Skip if the move is invalid
//         }

//         let value = this.minimax(1, depth + 1, alpha, beta);
//         this.gameState.undoMove(); // Undo the move for the next iteration
        
//         if (value > bestEval) {
//           if (depth === 0) {
//             console.log(value, bestEval, col);
//             bestMove = col; // Store evaluation for the move at depth 0
//           }
//           bestEval = value;
//         }
        
//         //console.log(bestEval, alpha, beta)

//         if (bestEval >= beta) {
//           //console.log("THIS IS A BETA CUT-OFF")
//           break // Beta cut-off
//         }

//         alpha = Math.max(alpha, bestEval);

//       }
//       else {
//         let moveMade = this.gameState.makeMove(col)
//         if (!moveMade.success) {
//           continue; // Skip if the move is invalid
//         }

//         let value = this.minimax(0, depth + 1, alpha, beta);
//         this.gameState.undoMove(); // Undo the move for the next iteration
        
//         if (value < bestEval) {
//           bestEval = value;
//           if (depth === 0) {
//             bestMove = col; // Store evaluation for the move at depth 0
//           }
//         }
        
//         if (bestEval <= alpha) {
//           //console.log("THIS IS A ALPHA CUT-OFF")
//           break // Alpha cut-off
//         }

//         beta = Math.min(beta, bestEval);
//       }
//     }
    
//     if (depth === 0) {
//       this.bestMove = bestMove; // Store the best move evaluation at depth 0
//     }
    
//     // Set the cache for this position
//     this.cache.set(myCurrentState, bestEval);
//     return bestEval;
//   }

// }

