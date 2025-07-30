import { Cell, Player } from "@shared/types/game";
import { StandardGame } from "./Games/game";
import { COLS, ROWS } from "@shared/constants/game";
import { IConnect4Solver, getConnect4Solver } from "@shared/WASM/con4Solver.type";




export class SelfAnalysis {
    
    private gameState: StandardGame; 
    private solver: IConnect4Solver;

    private constructor(game: StandardGame, solver: IConnect4Solver) { 
        this.gameState = game;
        this.solver = solver;
    }

    static async load(game: StandardGame): Promise<SelfAnalysis> {
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
    

    finalEval() {
        const pos = this.gameState.exportMoves();
        return this.solver.solvePosition(pos);
    }

    finalAnalysis() {
        const pos = this.gameState.exportMoves();
        return this.solver.analyzePosition(pos);
    }


    printAllEval() {
        const pos = this.gameState.exportMoves();
        let emptyPos = "";

        let i = 0;
        while (i <= pos.length) {
            const anal = this.solver.analyzePosition(emptyPos)
            console.log(emptyPos, pos[i], anal)
            emptyPos += pos[i]
            i++
        }
    }


    getAverageAccuracy() {
        
    }

}