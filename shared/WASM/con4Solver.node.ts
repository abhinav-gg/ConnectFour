import type { IConnect4Solver } from './con4Solver.type';
import path from 'path';

let wasmModule: any = null;

async function loadNodeWasm() {
  if (!wasmModule) {
    const mod = await import('./connect4_solver.js'); // Emscripten build
    const factory = mod.default ?? mod;
    wasmModule = await factory({
        locateFile: (file: string) => {
          return path.resolve(__dirname, file);
        }
      }); // <-- Emscripten-style async instantiation
  }
  return wasmModule;
}

export async function getConnect4Solver(): Promise<IConnect4Solver> {
  const module = await loadNodeWasm();

  if (typeof module.Connect4Solver !== 'function') {
    throw new Error('Connect4Solver is not available or not a constructor');
  }

  const solver = new module.Connect4Solver();

  return {
    analyzePosition(position: string) {
      const vec = solver.analyzePosition(position);
      return Array.from({ length: vec.size() }, (_, i) => vec.get(i));
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
