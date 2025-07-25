declare class Connect4Solver {
  analyzePosition(position: string): any;
  solvePosition(position: string): number;
  isBookLoaded(): boolean;
  getNodeCount(): number;
  reset(): void;
}

declare function Module(opts?: { locateFile?: (file: string) => string }): Promise<{
  Connect4Solver: typeof Connect4Solver;
}>;

export default Module;