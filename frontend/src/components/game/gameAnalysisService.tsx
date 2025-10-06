import { useRef, useState, useCallback, useEffect, MutableRefObject } from "react"
import { useWASM } from "@/components/providers/WASMProvider"
import { getEvaluationText } from "@/utils/colors"
import { fetchOpening, Opening, unknownOpening } from "@/utils/openingService"
import { Game } from '@shared/types/game.types'
import { logger } from '@/utils/logger'

/**
 * Analysis state interface for components
 */
export interface AnalysisState {
  // Header analysis
  isAnalysisLoading: boolean
  currentEvaluation: number
  headerEvaluation: string
  
  // Column analysis
  columnEvaluations: number[]
  columnAnalysisTexts: string[]
  
  // Opening information
  currentOpening: Opening
  isLoadingOpening: boolean
  
  // WASM state
  wasmReady: boolean
  wasmError: boolean
  isAnalyzing: boolean
}

/**
 * Analysis control interface for components
 */
export interface AnalysisControls {
  // Manual refresh
  refreshAnalysis: () => void
  
  // Opening management
  refreshOpening: () => void
}

/**
 * Reusable analysis service hook for Connect 4 game analysis
 * Manages WASM analysis, opening detection, and evaluation state
 * Provides consistent analysis data for header and column components
 */
export function useGameAnalysis<T extends Game>(
  gameRef: MutableRefObject<T | null>,
  gameStateVersion: number = 0
): [AnalysisState, AnalysisControls] {
  
  // WASM provider hook
  const { isReady: wasmReady, isLoading: wasmLoading, error: wasmError, analyzePosition, isAnalyzing } = useWASM()

  // Analysis state management
  const currentAnalysisIdRef = useRef<number>(0)
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true)
  const [currentEvaluation, setCurrentEvaluation] = useState<number>(0)
  const [headerEvaluation, setHeaderEvaluation] = useState<string>("Loading...")
  const [columnEvaluations, setColumnEvaluations] = useState<number[]>(Array(7).fill(-1000))
  const [columnAnalysisTexts, setColumnAnalysisTexts] = useState<string[]>(Array(7).fill("---"))
  
  // Opening state management
  const [currentOpening, setCurrentOpening] = useState<Opening>(unknownOpening)
  const [isLoadingOpening, setIsLoadingOpening] = useState(false)

  // Fetch opening based on current position
  const fetchOpeningForPosition = useCallback(async () => {
    const game = gameRef.current
    if (!game) {
      setCurrentOpening(unknownOpening)
      return
    }

    const movesString = game.exportMoves()
    if (!movesString) {
      // Empty position - show starting position info
      setCurrentOpening({
        moves: "",
        name: "Starting Position",
        description: "## Starting Position\n\nThis is the initial **Connect 4** position. Both players start with an empty 6×7 board.\n\n### Opening Principles\n\n- **Control the center**: The center columns (especially column 4) provide the most connection opportunities\n- **Create multiple threats**: Try to set up situations where you can win in multiple ways\n- **Block opponent threats**: Always look for and block opponent's winning moves\n\n*Good luck with your game!*"
      })
      return
    }

    setIsLoadingOpening(true)
    try {
      const opening = await fetchOpening(movesString)
      setCurrentOpening(opening)
    } catch (error) {
      setCurrentOpening(unknownOpening)
    } finally {
      setIsLoadingOpening(false)
    }
  }, [gameRef])

  // Update opening when game state changes
  useEffect(() => {
    fetchOpeningForPosition()
  }, [fetchOpeningForPosition, gameStateVersion])

  // Initialize analysis state based on WASM readiness
  const initializeAnalysisState = useCallback(() => {
    const game = gameRef.current
    
    if (!game) {
      setHeaderEvaluation("No game")
      setColumnAnalysisTexts(Array(7).fill("---"))
      setIsAnalysisLoading(false)
      return
    }

    if (!wasmReady) {
      setHeaderEvaluation("Loading WASM...")
      setColumnAnalysisTexts(Array(7).fill("---"))
      setIsAnalysisLoading(true)
      return
    }

    if (wasmError) {
      setHeaderEvaluation("WASM Error")
      setColumnAnalysisTexts(Array(7).fill("ERROR"))
      setIsAnalysisLoading(false)
      return
    }

    // If we get here, everything is ready for analysis
    setIsAnalysisLoading(true)
    setHeaderEvaluation("Analyzing...")
    setColumnAnalysisTexts(Array(7).fill("..."))
  }, [gameRef, wasmReady, wasmError])

  // Core analysis update function
  const updateAnalysis = useCallback(async () => {
    const game = gameRef.current
    logger.debug('ANALYSIS: updateAnalysis called - game:', !!game, 'wasmReady:', wasmReady)
    
    if (!game || !wasmReady) {
      logger.debug('ANALYSIS: Skipping analysis - missing prerequisites')
      return
    }

    try {
      setIsAnalysisLoading(true)
      
      const moves = game.getMoves()
      logger.debug('ANALYSIS: Analyzing moves:', moves)
      
      // Use analysis request ID to prevent race conditions
      const analysisId = ++currentAnalysisIdRef.current
      
      try {
        const result = await analyzePosition(moves)
        
        // Check if this is still the current analysis request
        if (analysisId !== currentAnalysisIdRef.current) {
          return
        }
        
        const { evaluation, columnResults } = result
        
        // Generate header evaluation using the utility function
        const headerEval = getEvaluationText(evaluation)

        // Process column analysis - use evaluation results directly
        const columnTexts: string[] = []
        const columnEvals: number[] = []
        
        for (let col = 0; col < 7; col++) {
          const colEval = columnResults[col]
          columnEvals.push(colEval)
          
          // Use the utility function for consistent formatting
          columnTexts.push(getEvaluationText(colEval))
        }
        
        // Update all analysis state
        setHeaderEvaluation(headerEval)
        setColumnAnalysisTexts(columnTexts)
        setCurrentEvaluation(evaluation)
        setColumnEvaluations(columnEvals)
        setIsAnalysisLoading(false)
        
      } catch (error) {
        // Handle analysis errors gracefully
        setHeaderEvaluation("ERROR")
        setColumnAnalysisTexts(Array(7).fill("---"))
        setColumnEvaluations(Array(7).fill(-1000))
        setIsAnalysisLoading(false)
      }
      
    } catch (error) {
      // Handle unexpected errors
      setHeaderEvaluation("ERROR")
      setColumnAnalysisTexts(Array(7).fill("---"))
      setColumnEvaluations(Array(7).fill(-1000))
      setIsAnalysisLoading(false)
    }
  }, [gameRef, wasmReady, analyzePosition])

  // Initialize analysis when game is available AND WASM is ready
  useEffect(() => {
    logger.debug('ANALYSIS: Initialize check - game:', !!gameRef.current, 'wasmReady:', wasmReady, 'wasmError:', wasmError)
    
    initializeAnalysisState()
    
    // Start analysis if everything is ready
    if (gameRef.current && wasmReady && !wasmError) {
      logger.performance('ANALYSIS: Starting initial analysis with 100ms delay')
      // Use a small delay to ensure everything is ready
      setTimeout(() => {
        updateAnalysis()
      }, 100)
    }
  }, [gameRef.current, wasmReady, wasmError, initializeAnalysisState, updateAnalysis])

  // Update analysis when game state changes (moves, navigation)
  useEffect(() => {
    const game = gameRef.current
    logger.performance('ANALYSIS: Game state version changed:', gameStateVersion, 'game:', !!game, 'wasmReady:', wasmReady)
    
    if (game && wasmReady) {
      logger.performance('ANALYSIS: Triggering analysis due to game state change')
      // Update analysis asynchronously without blocking
      updateAnalysis()
    }
  }, [gameStateVersion, updateAnalysis, wasmReady])

  // Also trigger analysis when WASM becomes ready (separate from game state)
  useEffect(() => {
    const game = gameRef.current
    if (game && wasmReady && !wasmError) {
      logger.performance('ANALYSIS: WASM became ready, triggering analysis')
      updateAnalysis()
    }
  }, [wasmReady, wasmError, updateAnalysis])

  // Manual refresh controls
  const refreshAnalysis = useCallback(() => {
    updateAnalysis()
  }, [updateAnalysis])

  const refreshOpening = useCallback(() => {
    fetchOpeningForPosition()
  }, [fetchOpeningForPosition])

  // Combine analysis state
  const analysisState: AnalysisState = {
    isAnalysisLoading,
    currentEvaluation,
    headerEvaluation,
    columnEvaluations,
    columnAnalysisTexts,
    currentOpening,
    isLoadingOpening,
    wasmReady,
    wasmError: !!wasmError,
    isAnalyzing
  }

  // Combine analysis controls
  const analysisControls: AnalysisControls = {
    refreshAnalysis,
    refreshOpening
  }

  return [analysisState, analysisControls]
}
