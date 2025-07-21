// backend/wasm/connect4Solver.ts
import connect4Module from "./connect4_solver.js"

// Define the interface for the solver instance
export interface IConnect4Solver {
  analyzePosition(position: string): number[];
  solvePosition(position: string): number;
  isBookLoaded(): boolean;
  getNodeCount(): number;
  reset(): void;
}

// Loader function that returns a ready-to-use solver instance
export async function getConnect4Solver(): Promise<IConnect4Solver> {
  // Dynamically import the Emscripten JS glue code
  const wasmModule = await connect4Module({
    locateFile: (file: string) => `./src/WASM/${file}`
  });
  const solver = new wasmModule.Connect4Solver();

  // Wrap embind vector in a real JS array for analyzePosition
  function analyzePosition(position: string): number[] {
    const vec = solver.analyzePosition(position);
    const arr: number[] = [];
    for (let i = 0; i < vec.size(); i++) arr.push(vec.get(i));
    return arr;
  }

  // Return the interface implementation
  return {
    analyzePosition,
    solvePosition: (position: string) => solver.solvePosition(position),
    isBookLoaded: () => solver.isBookLoaded(),
    getNodeCount: () => solver.getNodeCount(),
    reset: () => solver.reset(),
  };
}