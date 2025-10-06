"use client"

import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react'
import { logger } from '@/utils/logger'

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
  isActive: boolean
  activateWASM: () => void
  deactivateWASM: () => void
}

// Create context
const WASMContext = createContext<WASMContextType | null>(null)

// Provider component
export function WASMProvider({ 
  children, 
  active: initialActive = false 
}: { 
  children: React.ReactNode
  active?: boolean 
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isActive, setIsActive] = useState(initialActive)
  const wasmModuleRef = useRef<any>(null)
  
  let messageId = 0
  const generateId = () => `msg_${++messageId}`
  
  // Persistent worker and request tracking
  const workerRef = useRef<Worker | null>(null)
  const currentRequestRef = useRef<{
    id: string
    moves: number[]
    resolve: (result: AnalysisResult) => void
    reject: (error: Error) => void
  } | null>(null)

  // Initialize WASM on mount - load from shared connect4_solver script
  useEffect(() => {
    // Only initialize WASM when active
    if (!isActive) {
      logger.performance('WASM Provider: Inactive, skipping WASM initialization')
      setIsLoading(false)
      setIsReady(false)
      return
    }

    const initializeWASM = async () => {
      try {
        logger.performance('WASM Provider: Loading WASM module from shared script...')
        setIsLoading(true)
        setError(null)
        
        // Load WASM directly from shared connect4_solver script
        if (typeof window !== 'undefined') {
          // Check if Connect4SolverModule is already available
          if (!(window as any).Connect4SolverModule) {
            logger.performance('WASM Provider: Loading connect4_solver.js script...')
            const script = document.createElement('script')
            script.src = '/wasm/connect4_solver.js'
            document.head.appendChild(script)
            
            await new Promise((resolve, reject) => {
              script.onload = () => {
            logger.performance('WASM Provider: Script loaded')
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
              logger.performance('WASM Provider: Connect4SolverModule function found, initializing...')
              break
            }
            
            logger.performance(`WASM Provider: Waiting for Connect4SolverModule function... (attempt ${attempts + 1})`)
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }
          
          if (!((window as any).Connect4SolverModule && typeof (window as any).Connect4SolverModule === 'function')) {
            throw new Error('Connect4SolverModule function not available after loading script')
          }
          
          // Initialize the WASM module
          logger.performance('WASM Provider: Calling Connect4SolverModule() to initialize WASM...')
          const wasmModule = await (window as any).Connect4SolverModule({
            locateFile: (file: string) => `/wasm/${file}`,
          })
          wasmModuleRef.current = wasmModule
          
          // Test that the module has the expected Connect4Solver class
          if (wasmModule && wasmModule.Connect4Solver) {
            logger.performance('WASM Provider: Module ready with Connect4Solver class')
            
            // Test creating a solver instance
            const testSolver = new wasmModule.Connect4Solver()
            if (testSolver && typeof testSolver.solvePosition === 'function') {
              logger.performance('WASM Provider: Connect4Solver instance created successfully')
            } else {
              console.warn("⚠️ WASM Provider: Connect4Solver instance created but methods not found")
            }
          } else {
            console.warn("⚠️ WASM Provider: Module loaded but Connect4Solver class not found")
          }
          
          setIsReady(true)
          setIsLoading(false)
          logger.performance('WASM Provider: Module ready for analysis')
          
          // Initialize persistent worker for analysis
          initializePersistentWorker()
        }
        
      } catch (err) {
        console.error("❌ WASM Provider: Failed to load module:", err)
        setError(err instanceof Error ? err.message : 'Unknown WASM loading error')
        setIsLoading(false)
        setIsReady(false)
      }
    }

    // Initialize persistent worker for prioritized analysis
    const initializePersistentWorker = () => {
      logger.performance('WASM Provider: Initializing persistent worker...')
      
      // Get absolute URL for the worker script
      const scriptUrl = new URL('/wasm/connect4_solver.js', window.location.origin).href
      
      // Create persistent worker
      const workerCode = `
        // Load WASM in worker with absolute URL
        importScripts('${scriptUrl}');
        
        let wasmModule = null;
        let solver = null;
        let isReady = false;
        
        // Initialize WASM module once
        async function initializeWASM() {
          try {
            logger.performance('WASM Worker: Initializing Connect4SolverModule...');
            wasmModule = await Connect4SolverModule({
              locateFile: (file) => '${new URL('/wasm/', window.location.origin).href}' + file,
            });
            solver = new wasmModule.Connect4Solver();
            isReady = true;
            logger.performance('WASM Worker: Ready for analysis');
            
            // Signal ready
            self.postMessage({ type: 'ready' });
          } catch (error) {
            console.error('🔧 WASM Worker: Initialization failed:', error);
            self.postMessage({ type: 'error', error: error.message });
            // Retry initialization after a delay
            setTimeout(() => {
              logger.performance('WASM Worker: Retrying initialization...');
              initializeWASM();
            }, 1000);
          }
        }
        
        // Initialize immediately
        initializeWASM();
        
        self.addEventListener('message', function(e) {
          const { type, id, moves } = e.data;
          
          if (type === 'analyze') {
            if (!isReady || !solver) {
              self.postMessage({ type: 'result', id, error: 'Solver not ready' });
              return;
            }
            
            try {
              // Convert moves array to position string (1-indexed columns)
              const position = moves.map(move => (move + 1).toString()).join('');
              
              // Analyze the position
              const evaluation = solver.solvePosition(position);
              
              // Analyze all columns for best moves
              const analysisVector = solver.analyzePosition(position);
              const columnResults = [];
              for (let i = 0; i < analysisVector.size(); i++) {
                columnResults.push(analysisVector.get(i));
              }
              
              self.postMessage({
                type: 'result',
                id,
                evaluation,
                columnResults
              });
              
            } catch (error) {
              console.error('🔧 WASM Worker: Analysis error:', error);
              self.postMessage({
                type: 'result',
                id,
                error: error.message
              });
            }
          }
        });
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      workerRef.current = new Worker(URL.createObjectURL(blob))

      // Handle worker messages
      workerRef.current.onmessage = (e) => {
        const { type, id, evaluation, columnResults, error } = e.data
        
        if (type === 'ready') {
          logger.performance('WASM Provider: Persistent worker ready')
          return
        }
        
        if (type === 'result') {
          const request = currentRequestRef.current
          if (request && request.id === id) {
            currentRequestRef.current = null
            
            if (error) {
              console.warn('🔧 WASM Provider: Analysis failed:', error)
              // If it's a "Solver not ready" error, retry the request
              if (error.includes('Solver not ready')) {
                logger.performance('WASM Provider: Retrying analysis due to solver not ready...')
                setTimeout(() => {
                  if (workerRef.current) {
                    workerRef.current.postMessage({
                      type: 'analyze',
                      id: request.id,
                      moves: request.moves
                    })
                    // Restore the request
                    currentRequestRef.current = request
                  }
                }, 500) // Wait 500ms before retry
                return
              }
              request.reject(new Error(error))
            } else {
              request.resolve({ evaluation, columnResults })
            }
          }
          // If no matching request, it means the request was cancelled and already resolved with fake data
          
          // Update analyzing state
          setIsAnalyzing(currentRequestRef.current !== null)
        }
      }

      workerRef.current.onerror = (error) => {
        logger.error("❌ WASM Provider: Worker error:", error)
        if (currentRequestRef.current) {
          // Resolve with fake data instead of rejecting to avoid error state
          currentRequestRef.current.resolve({
            evaluation: 0,
            columnResults: [0, 0, 0, 0, 0, 0, 0]
          })
          currentRequestRef.current = null
        }
        setIsAnalyzing(false)
      }
    }

    initializeWASM()

    // Cleanup on unmount
    return () => {
      logger.performance('WASM Provider: Cleaning up...')
      if (wasmModuleRef.current) {
        wasmModuleRef.current = null
      }
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      // Reject all pending requests
      if (currentRequestRef.current) {
        // Resolve with fake data instead of rejecting to avoid error state
        currentRequestRef.current.resolve({
          evaluation: 0,
          columnResults: [0, 0, 0, 0, 0, 0, 0]
        })
        currentRequestRef.current = null
      }
      setIsReady(false)
    }
  }, [isActive])

  // Latest-only analysis function - cancels previous requests
  const analyzePosition = useCallback(async (moves: number[]): Promise<AnalysisResult> => {
    if (!isReady || !workerRef.current) {
      throw new Error('WASM not ready')
    }

    const requestId = generateId()
    logger.performance('WASM Provider: Sending latest analysis request (cancelling previous):', requestId, 'moves:', moves)
    
    // Cancel previous request if exists
    if (currentRequestRef.current) {
      logger.performance('WASM Provider: Cancelling previous request:', currentRequestRef.current.id)
      // Resolve cancelled requests with fake data to avoid error state in UI
      currentRequestRef.current.resolve({
        evaluation: 0,
        columnResults: [0, 0, 0, 0, 0, 0, 0]
      })
      currentRequestRef.current = null
    }
    
    setIsAnalyzing(true)
    
    return new Promise<AnalysisResult>((resolve, reject) => {
      // Store current request
      currentRequestRef.current = { id: requestId, moves, resolve, reject }
      
      // Add timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        if (currentRequestRef.current && currentRequestRef.current.id === requestId) {
          logger.warn('🔧 WASM Provider: Request timeout:', requestId)
          // Resolve with fake data instead of rejecting to avoid error state
          currentRequestRef.current.resolve({
            evaluation: 0,
            columnResults: [0, 0, 0, 0, 0, 0, 0]
          })
          currentRequestRef.current = null
          setIsAnalyzing(false)
        }
      }, 10000) // 10 second timeout
      
      // Override reject to clear timeout
      const originalReject = reject
      const wrappedReject = (error: Error) => {
        clearTimeout(timeoutId)
        originalReject(error)
      }
      
      // Override resolve to clear timeout  
      const originalResolve = resolve
      const wrappedResolve = (result: AnalysisResult) => {
        clearTimeout(timeoutId)
        originalResolve(result)
      }
      
      // Update stored request with wrapped functions
      currentRequestRef.current = { id: requestId, moves, resolve: wrappedResolve, reject: wrappedReject }
      
      // Send to worker
      workerRef.current!.postMessage({
        type: 'analyze',
        id: requestId,
        moves
      })
    })
  }, [isReady])

  // Clear cache (for manual cleanup)
  const clearCache = useCallback(() => {
    logger.performance('WASM Provider: Manually clearing cache')
    wasmModuleRef.current = null
    setIsReady(false)
  }, [])

  // WASM activation control
  const activateWASM = useCallback(() => {
    if (!isActive) {
      logger.performance('WASM Provider: Activating WASM')
      setIsActive(true)
    }
  }, [isActive])

  const deactivateWASM = useCallback(() => {
    if (isActive) {
      logger.performance('WASM Provider: Deactivating WASM')
      setIsActive(false)
      setIsReady(false)
      setIsLoading(false)
      setIsAnalyzing(false)
      
      // Clean up worker and module
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      if (wasmModuleRef.current) {
        wasmModuleRef.current = null
      }
      if (currentRequestRef.current) {
        currentRequestRef.current.resolve({
          evaluation: 0,
          columnResults: [0, 0, 0, 0, 0, 0, 0]
        })
        currentRequestRef.current = null
      }
    }
  }, [isActive])

  const contextValue: WASMContextType = {
    isLoading,
    isReady,
    error,
    clearCache,
    analyzePosition,
    isAnalyzing,
    isActive,
    activateWASM,
    deactivateWASM
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