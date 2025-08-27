"use client"

import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react'

// Analysis result interface
interface AnalysisResult {
  evaluation: number
  columnResults: number[]
}

// WASM Context interface
interface WASMContextType {
  isLoading: boolean
  isReady: boolean
  error: string | null
  clearCache: () => void
  analyzePosition: (moves: number[]) => Promise<AnalysisResult>
  isAnalyzing: boolean
}

// Create context
const WASMContext = createContext<WASMContextType | null>(null)

// Provider component
export function WASMProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const wasmModuleRef = useRef<any>(null)
  
  let messageId = 0
  const generateId = () => `msg_${++messageId}`

  // Initialize WASM on mount - load from shared connect4_solver script
  useEffect(() => {
    const initializeWASM = async () => {
      try {
        console.log("🔧 WASM Provider: Loading WASM module from shared script...")
        setIsLoading(true)
        setError(null)
        
        // Load WASM directly from shared connect4_solver script
        if (typeof window !== 'undefined') {
          // Check if Connect4SolverModule is already available
          if (!(window as any).Connect4SolverModule) {
            console.log("🔧 WASM Provider: Loading connect4_solver.js script...")
            const script = document.createElement('script')
            script.src = '/wasm/connect4_solver.js'
            document.head.appendChild(script)
            
            await new Promise((resolve, reject) => {
              script.onload = () => {
                console.log("🔧 WASM Provider: Script loaded")
                resolve(undefined)
              }
              script.onerror = (error) => {
                console.error("🔧 WASM Provider: Script failed to load:", error)
                reject(error)
              }
            })
          }
          
          // Wait for Connect4SolverModule to be available and ensure it's a function
          let attempts = 0
          const maxAttempts = 50 // 5 seconds max
          
          while (attempts < maxAttempts) {
            if ((window as any).Connect4SolverModule && typeof (window as any).Connect4SolverModule === 'function') {
              console.log("🔧 WASM Provider: Connect4SolverModule function found, initializing...")
              break
            }
            
            console.log(`🔧 WASM Provider: Waiting for Connect4SolverModule function... (attempt ${attempts + 1})`)
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }
          
          if (!((window as any).Connect4SolverModule && typeof (window as any).Connect4SolverModule === 'function')) {
            throw new Error('Connect4SolverModule function not available after loading script')
          }
          
          // Initialize the WASM module
          console.log("🔧 WASM Provider: Calling Connect4SolverModule() to initialize WASM...")
          const module = await (window as any).Connect4SolverModule({
            locateFile: (file: string) => `/wasm/${file}`,
          })
          wasmModuleRef.current = module
          
          // Test that the module has the expected Connect4Solver class
          if (module && module.Connect4Solver) {
            console.log("✅ WASM Provider: Module ready with Connect4Solver class")
            
            // Test creating a solver instance
            const testSolver = new module.Connect4Solver()
            if (testSolver && typeof testSolver.solvePosition === 'function') {
              console.log("✅ WASM Provider: Connect4Solver instance created successfully")
            } else {
              console.warn("⚠️ WASM Provider: Connect4Solver instance created but methods not found")
            }
          } else {
            console.warn("⚠️ WASM Provider: Module loaded but Connect4Solver class not found")
          }
          
          setIsReady(true)
          setIsLoading(false)
          console.log("✅ WASM Provider: Module ready for analysis")
        }
        
      } catch (err) {
        console.error("❌ WASM Provider: Failed to load module:", err)
        setError(err instanceof Error ? err.message : 'Unknown WASM loading error')
        setIsLoading(false)
        setIsReady(false)
      }
    }

    initializeWASM()

    // Cleanup on unmount
    return () => {
      console.log("🧹 WASM Provider: Cleaning up...")
      if (wasmModuleRef.current) {
        wasmModuleRef.current = null
      }
      setIsReady(false)
    }
  }, [])

  // Asynchronous analysis function using Web Worker
  const analyzePosition = useCallback(async (moves: number[]): Promise<AnalysisResult> => {
    if (!isReady || !wasmModuleRef.current) {
      throw new Error('WASM not ready')
    }

    setIsAnalyzing(true)
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🔧 WASM Provider: Starting async analysis for moves:', moves)
        
        // Get absolute URL for the worker script
        const scriptUrl = new URL('/wasm/connect4_solver.js', window.location.origin).href
        
        // Create Web Worker for this analysis
        const workerCode = `
          // Load WASM in worker with absolute URL
          importScripts('${scriptUrl}');
          
          self.addEventListener('message', async function(e) {
            const { moves } = e.data;
            
            try {
              console.log('🔧 WASM Worker: Initializing Connect4SolverModule...');
              // Initialize WASM module in worker
              const wasmModule = await Connect4SolverModule({
                locateFile: (file) => '${new URL('/wasm/', window.location.origin).href}' + file,
              });
              console.log('🔧 WASM Worker: Module initialized successfully');
              
              // Create solver instance
              const solver = new wasmModule.Connect4Solver();
              console.log('🔧 WASM Worker: Solver instance created');
              
              // Convert moves array to position string (1-indexed columns)
              const position = moves.map(move => (move + 1).toString()).join('');
              console.log('🔧 WASM Worker: Position string:', position);
              
              console.log('🔧 WASM Worker: Running analysis...');
              
              // Analyze the position
              const evaluation = solver.solvePosition(position);
              console.log('🔧 WASM Worker: Got evaluation:', evaluation);
              
              // Analyze all columns for best moves
              const analysisVector = solver.analyzePosition(position);
              const columnResults = [];
              for (let i = 0; i < analysisVector.size(); i++) {
                columnResults.push(analysisVector.get(i));
              }
              
              console.log('🔧 WASM Worker: Got column results:', columnResults);
              console.log('🔧 WASM Worker: Analysis complete, sending results...');
              
              self.postMessage({
                evaluation,
                columnResults
              });
              
            } catch (error) {
              console.error('🔧 WASM Worker: Error during analysis:', error);
              self.postMessage({
                error: error.message
              });
            }
          });
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        const timeoutId = setTimeout(() => {
          worker.terminate()
          setIsAnalyzing(false)
          reject(new Error('Analysis timeout'))
        }, 30000)
        
        worker.onmessage = (e) => {
          clearTimeout(timeoutId)
          worker.terminate()
          setIsAnalyzing(false)
          
          if (e.data.error) {
            console.error('🔧 WASM Provider: Analysis failed:', e.data.error)
            reject(new Error(e.data.error))
          } else {
            console.log('🔧 WASM Provider: Analysis complete:', e.data)
            resolve(e.data)
          }
        }
        
        worker.onerror = (error) => {
          clearTimeout(timeoutId)
          worker.terminate()
          setIsAnalyzing(false)
          console.error('🔧 WASM Provider: Worker error:', error)
          reject(new Error('Worker error'))
        }
        
        // Start analysis
        worker.postMessage({ moves })
        
      } catch (error) {
        setIsAnalyzing(false)
        console.error('🔧 WASM Provider: Failed to start analysis:', error)
        reject(error)
      }
    })
  }, [isReady])

  // Clear cache (for manual cleanup)
  const clearCache = useCallback(() => {
    console.log("🧹 WASM Provider: Manually clearing cache")
    wasmModuleRef.current = null
    setIsReady(false)
  }, [])

  const contextValue: WASMContextType = {
    isLoading,
    isReady,
    error,
    clearCache,
    analyzePosition,
    isAnalyzing
  }

  return (
    <WASMContext.Provider value={contextValue}>
      {children}
    </WASMContext.Provider>
  )
}

// Hook to use WASM context
export function useWASM() {
  const context = useContext(WASMContext)
  if (!context) {
    throw new Error('useWASM must be used within a WASMProvider')
  }
  return context
}