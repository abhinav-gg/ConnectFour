// src/shared/WASM/con4Solver.browser.ts

export interface IConnect4Solver {
    analyzePosition(position: string): number[];
    solvePosition(position: string): number;
    isBookLoaded(): boolean;
    getNodeCount(): number;
    reset(): void;
  }
  
  let wasmModule: any = null;
  
  async function loadModule(): Promise<any> {
    if (wasmModule) return wasmModule;
  
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('loadModule() can only run in browser');
    }
  
    // Check if script already loaded
    if (!document.getElementById('connect4_solver_script')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'connect4_solver_script';
        script.src = '/wasm/connect4_solver.js'; // must be under /public/wasm/
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load connect4_solver.js'));
        document.body.appendChild(script);
      });
    }
  
    // Check global factory
    const factory = (window as any).Connect4SolverModule;
    if (typeof factory !== 'function') {
      throw new Error('Connect4SolverModule factory not found on window');
    }
  
    wasmModule = await factory({
      locateFile: (file: string) => `/wasm/${file}`,
    });
  
    return wasmModule;
  }
  
  export async function getConnect4Solver(): Promise<IConnect4Solver> {
    const module = await loadModule();
    const solver = new module.Connect4Solver();
  
    return {
      analyzePosition(position: string) {
        const vec = solver.analyzePosition(position);
        const arr: number[] = [];
        for (let i = 0; i < vec.size(); i++) {
          arr.push(vec.get(i));
        }
        return arr;
      },
      solvePosition(position: string) {
        return solver.solvePosition(position);
      },
      isBookLoaded() {
        return solver.isBookLoaded();
      },
      getNodeCount() {
        return solver.getNodeCount();
      },
      reset() {
        solver.reset();
      },
    };
  }
  