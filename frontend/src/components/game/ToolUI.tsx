"use client"

import { useState, useRef, useImperativeHandle, forwardRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility/move-history"
import { OpeningDescription } from "@/components/game/utility/opening"
import { EnterMoves } from "@/components/game/utility/enter-moves"
import { useWASM } from "@/components/providers/wasmProvider"
import { getEvaluationText } from "@/utils/colors"
import { HistoryStandardGame } from "@shared/utils/Games/history-game"

export interface ToolUIRef {
  // Add any methods you want to expose to parent components
}

interface ToolUIProps {
  // Game and Move History Props
  game?: HistoryStandardGame
  gameStateVersion?: number // Version number to detect game state changes
  currentMoveIndex?: number
  movesOverride?: number[]
  
  // Analysis Control
  showAnalysisFeatures?: boolean
  // Note: Removed external analysis props - ToolUI now manages its own analysis
  
  // Opening Description Props
  openingName?: string
  openingDescription?: string
  showOpeningDescription?: boolean
  
  // Enter Moves Props
  showEnterMoves?: boolean
  enterMovesPlaceholder?: string
  
  // Event Handlers
  onMoveClick?: (moveIndex: number) => void
  onToggleAnalysis?: (enabled: boolean) => void
  onSettingsClick?: () => void
  onCloseOpening?: () => void
  onSubmitMoves?: (moves: number[]) => void
  onColumnClick?: (column: number) => void
}

const ToolUI = forwardRef<ToolUIRef, ToolUIProps>((props, ref) => {
  const {
    game,
    gameStateVersion = 0,
    currentMoveIndex = 0,
    movesOverride,
    showAnalysisFeatures = true,
    openingName,
    openingDescription,
    showOpeningDescription = false,
    showEnterMoves = true,
    enterMovesPlaceholder,
    onMoveClick,
    onToggleAnalysis,
    onSettingsClick,
    onCloseOpening,
    onSubmitMoves,
    onColumnClick,
  } = props

  // UI State
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)

  // Web Worker for non-blocking WASM analysis
  const { isReady: wasmReady, isLoading: wasmLoading, error: wasmError, analyzePosition, isAnalyzing } = useWASM()

  // Internal Analysis State
  const currentAnalysisIdRef = useRef<number>(0)
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true)
  const [analysisData, setAnalysisData] = useState<string[]>(() => 
    wasmReady ? ["Loading..."] : ["Loading WASM..."]
  )
  const [currentEvaluation, setCurrentEvaluation] = useState<number>(0)
  const [columnEvaluations, setColumnEvaluations] = useState<number[]>(Array(7).fill(-1000))

  console.log("🔧 TOOLUI: Component rendering with game:", game?.getMoves().length, "moves")
  console.log("🔧 TOOLUI: WASM state:", { wasmLoading, wasmReady, wasmError })

  // Initialize analysis when game is available AND WASM is ready
  useEffect(() => {
    const initializeAnalysis = async () => {
      if (!game) {
        console.log("🔧 TOOLUI: No game available")
        setAnalysisData(["No game"])
        setIsAnalysisLoading(false)
        return
      }

      if (!wasmReady) {
        console.log("🔧 TOOLUI: WASM not ready yet")
        setAnalysisData(["Loading WASM..."])
        setIsAnalysisLoading(true)
        return
      }

      if (wasmError) {
        console.error("🔧 TOOLUI: WASM error:", wasmError)
        setAnalysisData(["WASM Error"])
        setIsAnalysisLoading(false)
        return
      }

      try {
        console.log("🔧 TOOLUI: Initializing analysis for game with", game.getMoves().length, "moves")
        setIsAnalysisLoading(true)
        setAnalysisData(["Analyzing..."])
        
        // Start analysis immediately using new WASM provider
        updateAnalysis()
        
      } catch (error) {
        console.error("🔧 TOOLUI: Failed to initialize analysis:", error)
        setAnalysisData(["Analysis Error"])
        setIsAnalysisLoading(false)
      }
    }

    initializeAnalysis()
  }, [game, wasmReady, wasmError]) // Re-initialize when WASM state changes

  // Update analysis when game state changes
  const updateAnalysis = useCallback(async () => {
    if (!game || !wasmReady) {
      console.log("🔧 TOOLUI: Cannot update analysis - missing requirements", {
        hasGame: !!game,
        wasmReady: wasmReady
      })
      return
    }

    try {
      console.log("🔧 TOOLUI: Updating analysis...")
      setIsAnalysisLoading(true)
      
      const moves = game.getMoves()
      console.log("🔧 TOOLUI: Analyzing moves:", moves)
      
      // Use new WASM provider for analysis
      const analysisId = ++currentAnalysisIdRef.current
      
      try {
        const result = await analyzePosition(moves)
        
        // Check if this is still the current analysis request
        if (analysisId !== currentAnalysisIdRef.current) {
          console.log("🔧 TOOLUI: Analysis outdated, ignoring result")
          return
        }
        
        console.log("🔧 TOOLUI: Analysis result:", result)
        
        const { evaluation, columnResults } = result
        
        // Generate header evaluation using the utility function
        const headerEval = getEvaluationText(evaluation)

        // Process column analysis - use evaluation results directly
        const columnAnalyses: string[] = []
        const columnEvals: number[] = []
        
        for (let col = 0; col < 7; col++) {
          const colEval = columnResults[col]
          columnEvals.push(colEval)
          
          // Use the utility function for consistent formatting
          columnAnalyses.push(getEvaluationText(colEval))
        }

        console.log("🔧 TOOLUI: Setting analysis data:", [headerEval, ...columnAnalyses])
        console.log("🔧 TOOLUI: Setting column evaluations:", columnEvals)
        
        setAnalysisData([headerEval, ...columnAnalyses])
        setCurrentEvaluation(evaluation)
        setColumnEvaluations(columnEvals)
        setIsAnalysisLoading(false)
        
      } catch (error) {
        console.error("🔧 TOOLUI: Analysis failed:", error)
        setAnalysisData(["ERROR", "---", "---", "---", "---", "---", "---", "---"])
        setColumnEvaluations(Array(7).fill(-1000))
        setIsAnalysisLoading(false)
      }
      
    } catch (error) {
      console.error("🔧 TOOLUI: Error updating analysis:", error)
      setAnalysisData(["ERROR", "---", "---", "---", "---", "---", "---", "---"])
      setColumnEvaluations(Array(7).fill(-1000))
      setIsAnalysisLoading(false)
    }
  }, [game, wasmReady, analyzePosition])

  // Update analysis when game state changes (moves, navigation)
  useEffect(() => {
    if (game && gameStateVersion > 0 && wasmReady) {
      console.log("🔧 TOOLUI: Game state changed (version:", gameStateVersion, "), updating analysis...")
      
      // Update analysis asynchronously without blocking
      updateAnalysis()
    }
  }, [gameStateVersion, updateAnalysis, wasmReady]) // React to version changes and WASM state

  const handleToggleAnalysis = (enabled: boolean) => {
    if (showAnalysisFeatures) {
      setIsAnalysisEnabled(enabled)
      onToggleAnalysis?.(enabled)
    }
  }

  const handleSettingsClick = () => {
    console.log("Settings clicked")
    onSettingsClick?.()
  }

  const handleMoveClick = (moveIndex: number) => {
    console.log("Move clicked:", moveIndex)
    onMoveClick?.(moveIndex)
  }

  const handleCloseOpening = () => {
    console.log("Closing opening description")
    onCloseOpening?.()
  }

  const handleSubmitMoves = (moves: number[]) => {
    console.log("Moves submitted:", moves)
    onSubmitMoves?.(moves)
  }

  // Expose functions to parent component if needed
  useImperativeHandle(ref, () => ({}), [])

  return (
    <div className="flex-1 flex flex-col text-white h-full overflow-hidden">
      {/* Analysis Header - Always visible when analysis features are enabled */}
      {showAnalysisFeatures && (
        <div className="flex-shrink-0">
          <AnalysisHeader
            isAnalysisEnabled={isAnalysisEnabled}
            isLoading={isAnalysisLoading}
            onToggleAnalysis={handleToggleAnalysis}
            onSettingsClick={handleSettingsClick}
            showAnalysisToggle={true}
            evaluation={currentEvaluation}
          />
        </div>
      )}

      {/* Column Analysis - Fixed Height when visible */}
      <div className="flex-shrink-0">
        <AnimatePresence>
          {showAnalysisFeatures && isAnalysisEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <ColumnAnalysis 
                evaluations={columnEvaluations}
                isLoading={isAnalysisLoading}
                onColumnClick={onColumnClick}
                gameOver={game?.gameOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Move History - Fixed Height */}
      <div className="flex-shrink-0 h-[220px] mb-4">
        {game ? (
          <MoveHistory 
            game={game} 
            onMoveClick={onMoveClick} 
            moves={movesOverride} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No game data available
          </div>
        )}
      </div>

      {/* Opening Description - Always visible, fixed height */}
      <div className="flex-shrink-0 h-[200px]">
        <OpeningDescription
          openingName={openingName || "Position Analysis"}
          description={analysisData[0] || openingDescription || "## Current Position Analysis\n\nThis is a **Connect 4** analysis tool that provides:\n\n- **Real-time evaluation** of board positions\n- **Move suggestions** based on perfect play\n- **Interactive exploration** of game lines\n\n### How to Use\n\n1. Click on the board to make moves\n2. Use the move input below to enter sequences\n3. Navigate through move history to analyze positions\n\n*The analysis uses a perfect solver to evaluate all positions accurately.*"}
          showCloseButton={showOpeningDescription}
          onClose={showOpeningDescription ? handleCloseOpening : undefined}
        />
      </div>

      {/* Enter Moves - Takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence>
          {showEnterMoves && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col justify-center p-4"
            >
              <EnterMoves
                onSubmitMoves={handleSubmitMoves}
                placeholder={enterMovesPlaceholder}
                game={game} // Pass the game prop for export functionality
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when enter moves is not shown */}
        {!showEnterMoves && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p className="text-center">
              No move input available
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

ToolUI.displayName = "ToolUI"
export default ToolUI
