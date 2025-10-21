import { IConnect4Solver, getConnect4Solver } from "../WASM/con4Solver";
import { Game } from "@shared/types/game.types";


export class SelfAnalysis {

  protected gameState: Game;
  protected solver: IConnect4Solver;

  protected constructor(game: Game, solver: IConnect4Solver) { 
    this.gameState = game;
    this.solver = solver;
  }

  static async load(game: Game): Promise<SelfAnalysis> {
    const solver = await getConnect4Solver();
    return new SelfAnalysis(game, solver);
  }

  sortedBestMoves(arr: number[]): number[][] {
    // Helper: assign rank/category to a value for sorting
    const rank = (v: number) => (v > 0 ? 1 : v === 0 ? 2 : 3);
    // Sort with a single compare function
    const sorted = arr
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => {
        const rA = rank(a.val);
        const rB = rank(b.val);
  
        if (rA !== rB) return rA - rB;
  
        return rA === 1
          ? a.val - b.val // positive ascending
          : rA === 2
          ? 0 // zeros equal
          : Math.abs(b.val) - Math.abs(a.val); // negatives descending abs
      });
  
    // Group by equal values using reduce
    return sorted.reduce<number[][]>((groups, { val, idx }) => {
      if (groups.length === 0 || arr[groups[groups.length - 1][0]] !== val) {
        groups.push([idx]);
      } else {
        groups[groups.length - 1].push(idx);
      }
      return groups;
    }, []);
  }
  

  Eval() {
    const pos = this.gameState.exportMoves();
    return this.solver.solvePosition(pos);
  }

  Analyze() {
    const pos = this.gameState.exportMoves();
    console.log("Final Analysis for position:", pos);
    return this.solver.analyzePosition(pos);
  }


  printAllEval() { // dev command
      const pos = this.gameState.exportMoves();
      let emptyPos = "";

      let i = 0;
      while (i <= pos.length) {
          const anal = this.solver.analyzePosition(emptyPos)
          // console.log(emptyPos, pos[i], anal)
          emptyPos += pos[i]
          i++
      }
  }

  /* Function to calculate the accuracy of the last move made in the given position string */
  getLastMoveAcc(pos: string) {
    const alpha = 0.8; // WEIGHTING

    const p = pos ?? this.gameState.exportMoves();
    if (p.length === 0) return -1;
    const position = p.slice(0, -1); // Remove last move
    const analysis = this.solver.analyzePosition(position);
    const sortedAnal = this.sortedBestMoves(analysis);
    const move = Number(p.at(-1)) - 1;
    const n = sortedAnal.length;
    const i = sortedAnal.findIndex(group => group.includes(move)); 
    const gi = n === 1 ? 0 : (i) / (n - 1);
    const xe = Math.max(...analysis);
    const ne = Math.min(...analysis);
    const ri = (xe - analysis[move]) / (xe - ne);
    return 100 * (1 - ((gi * alpha) + (ri * (1 - alpha))));
  }


  getAverageAccuracy(aPlayer?: number) {

    let Accuracy = [];
    const player = aPlayer ?? this.gameState.currentPlayer;
    // iterate through all the moves made
    const iterator = this.gameState.cumulativeMoves()
    for (const moves of iterator) {
      // analyze each move for the specified player
      if (!iterator.hasNext()) continue;
      if (moves.length % 2 !== player) continue; // not the current players turn
      const acc = this.getLastMoveAcc(moves);
      Accuracy.push(acc);
    }

    return Accuracy.reduce((a, b) => a + b, 0) / Accuracy.length;
  }


  static getRatioFromEval(evalulation: number): number {
    if (evalulation !== 0) {
      return 0.5 - (1 / (2 * evalulation));
    } else {
      return 0.5;
    }
  }

  getRatio() {
    const evaluation = this.Eval();
    return SelfAnalysis.getRatioFromEval(evaluation);
  }


}