export interface IConnect4Solver {
  analyzePosition(position: string): number[];
  solvePosition(position: string): number;
  isBookLoaded(): boolean;
  getNodeCount(): number;
  reset(): void;
}

function isBrowserRuntime(): boolean {
  return (
    (typeof window !== 'undefined' &&
      typeof window.document !== 'undefined') ||
    process.env.NEXT_RUNTIME === 'nodejs'
  );
}

function isNodeRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null &&
    !isBrowserRuntime()
  );
}

// Local cache variable
let cachedSolver: Promise<IConnect4Solver> | null = null;

const getConnect4Solver = async (): Promise<IConnect4Solver> => {
  if (cachedSolver) {
    return cachedSolver;
  }
  console.warn('getConnect4Solver() called without cache, initializing...');
  if (isNodeRuntime()) {
    const nodeModulePath = './con4Solver.node';
    const dynamicRequire = eval('require');
    cachedSolver = Promise.resolve(dynamicRequire(nodeModulePath).getConnect4Solver());
  } else if (isBrowserRuntime()) {
    cachedSolver = import('./con4Solver.browser').then(mod => mod.getConnect4Solver());
  } else {
    cachedSolver = Promise.reject(new Error('Unsupported environment for Connect4Solver'));
  }

  return cachedSolver;
};

export { getConnect4Solver };
