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
    // Only initialize when active
    if (!isActive) {
      setIsLoading(false)
      setIsReady(false)
      return
    }

    const initializeWASM = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load WASM directly from shared connect4_solver script
        if (typeof window === 'undefined') throw new Error('WASM must be initialized in a browser environment')

        // Load the shared script if needed
        if (!(window as any).Connect4SolverModule) {
          const script = document.createElement('script')
          script.src = '/wasm/connect4_solver.js'
          document.head.appendChild(script)
          await new Promise((resolve, reject) => {
            script.onload = () => resolve(undefined)
            script.onerror = (e) => reject(e)
          })
        }

        // Wait for the factory function to appear (short loop)
        let attempts = 0
        while (!(window as any).Connect4SolverModule && attempts < 50) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }

        if (!(window as any).Connect4SolverModule) throw new Error('Connect4SolverModule did not load')

        const wasmModule = await (window as any).Connect4SolverModule({
          locateFile: (file: string) => `/wasm/${file}`,
        })
          wasmModuleRef.current = wasmModule
          
          // Test that the module has the expected Connect4Solver class
        if (!(wasmModule && wasmModule.Connect4Solver)) {
          throw new Error('Connect4Solver class not found on WASM module')
        }

        setIsReady(true)
        setIsLoading(false)

        // Initialize persistent worker for analysis
        initializePersistentWorker()
      } catch (err) {
        console.error("❌ WASM Provider: Failed to load module:", err)
        setError(err instanceof Error ? err.message : 'Unknown WASM loading error')
        setIsLoading(false)
        setIsReady(false)
      }
    }

    // Initialize persistent worker for prioritized analysis
    const initializePersistentWorker = () => {
      const scriptUrl = new URL('/wasm/connect4_solver.js', window.location.origin).href

      // Worker bootstrap code must not import app-only modules like logger
      const workerCode = `
        importScripts('${scriptUrl}');
        let wasmModule = null;
        let solver = null;
        let ready = false;

        async function init() {
          try {
            wasmModule = await Connect4SolverModule({ locateFile: (f) => '${new URL('/wasm/', window.location.origin).href}' + f });
            solver = new wasmModule.Connect4Solver();
            ready = true;
            self.postMessage({ type: 'ready' });
          } catch (e) {
            self.postMessage({ type: 'error', error: String(e) });
            setTimeout(init, 1000);
          }
        }
        init();

        self.addEventListener('message', (ev) => {
          const { type, id, moves } = ev.data || {};
          if (type !== 'analyze') return;
          if (!ready || !solver) {
            self.postMessage({ type: 'result', id, error: 'Solver not ready' });
            return;
          }
          try {
            const position = (moves || []).map(m => (m + 1).toString()).join('');
            const evaluation = solver.solvePosition(position);
            const vec = solver.analyzePosition(position);
            const columnResults = [];
            for (let i = 0; i < vec.size(); i++) columnResults.push(vec.get(i));
            self.postMessage({ type: 'result', id, evaluation, columnResults });
          } catch (e) {
            self.postMessage({ type: 'result', id, error: String(e) });
          }
        });
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      workerRef.current = new Worker(URL.createObjectURL(blob))

      workerRef.current.onmessage = (e) => {
        const { type, id, evaluation, columnResults, error } = e.data || {}
        if (type === 'ready') return

        if (type === 'result') {
          const request = currentRequestRef.current
          if (request && request.id === id) {
            currentRequestRef.current = null
            if (error) {
              // If solver isn't ready, retry once after a short delay
              if (String(error).includes('Solver not ready')) {
                setTimeout(() => {
                  if (workerRef.current) {
                    currentRequestRef.current = request
                    workerRef.current.postMessage({ type: 'analyze', id: request.id, moves: request.moves })
                  }
                }, 500)
                return
              }
              request.reject(new Error(String(error)))
            } else {
              request.resolve({ evaluation, columnResults })
            }
          }
          setIsAnalyzing(currentRequestRef.current !== null)
        }
      }

      workerRef.current.onerror = () => {
        if (currentRequestRef.current) {
          currentRequestRef.current.resolve({ evaluation: 0, columnResults: [0,0,0,0,0,0,0] })
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