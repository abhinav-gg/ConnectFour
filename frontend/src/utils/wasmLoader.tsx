// utils/loadConnect4Solver.ts
export function loadConnect4Solver(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).Connect4SolverModule) {
        resolve((window as any).Connect4SolverModule);
        return;
      }
  
      // Create script tag
      const script = document.createElement('script');
      script.src = '/connect4_solver.js'; // adjust if in subfolder
      script.async = true;
  
      script.onload = () => {
        // The module factory function is now available as window.Module or window.createConnect4SolverModule
        // We call it with locateFile to ensure .wasm and .data are found
        const ModuleFactory = (window as any).Module || (window as any).createConnect4SolverModule;
        if (!ModuleFactory) {
          reject(new Error('Connect4Solver module factory not found on window'));
          return;
        }
        ModuleFactory({
          locateFile: (path: string) => `/${path}` // adjust if in subfolder
        }).then((mod: any) => {
          (window as any).Connect4SolverModule = mod; // cache for future loads
          resolve(mod);
        });
      };
  
      script.onerror = () => reject(new Error('Failed to load connect4_solver.js'));
  
      document.body.appendChild(script);
    });
}