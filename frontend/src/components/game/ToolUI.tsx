"use client"

import { useState, useRef, useImperativeHandle, forwardRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility/move-history"
import { OpeningDescription } from "@/components/game/utility/opening"
import { EnterMoves } from "@/components/game/utility/enter-moves"
import { StandardGame } from "@shared/utils/Games/game"

export interface ToolUIRef {
  // Add any methods you want to expose to parent components
}

interface ToolUIProps {
  // Game and Move History Props
  game?: StandardGame
  currentMoveIndex?: number
  movesOverride?: number[]
  
  // Analysis Control
  showAnalysisFeatures?: boolean
  analysisData?: React.MutableRefObject<string[]> // Analysis array ref [header, col1, col2, ..., col7]
  evaluation?: number // Raw evaluation number for color determination
  columnEvaluations?: React.MutableRefObject<number[]> // Raw column evaluation numbers for click functionality
  
  // Opening Description Props
  openingName?: string
  openingDescription?: string
  showOpeningDescription?: boolean
  
  // Enter Moves Props
  showEnterMoves?: boolean
  enterMovesDisabled?: boolean
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
    currentMoveIndex = 0,
    movesOverride,
    showAnalysisFeatures = true,
    analysisData,
    evaluation = 0,
    columnEvaluations,
    openingName,
    openingDescription,
    showOpeningDescription = false,
    showEnterMoves = true,
    enterMovesDisabled = false,
    enterMovesPlaceholder,
    onMoveClick,
    onToggleAnalysis,
    onSettingsClick,
    onCloseOpening,
    onSubmitMoves,
    onColumnClick,
  } = props

  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)

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
            analysisType={analysisData?.current?.[0] || "Loading..."}
            isAnalysisEnabled={isAnalysisEnabled}
            onToggleAnalysis={handleToggleAnalysis}
            onSettingsClick={handleSettingsClick}
            showAnalysisToggle={true}
            evaluation={evaluation}
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
                evaluations={columnEvaluations?.current}
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
          description={analysisData?.current?.[0] || openingDescription || "## Current Position Analysis\n\nThis is a **Connect 4** analysis tool that provides:\n\n- **Real-time evaluation** of board positions\n- **Move suggestions** based on perfect play\n- **Interactive exploration** of game lines\n\n### How to Use\n\n1. Click on the board to make moves\n2. Use the move input below to enter sequences\n3. Navigate through move history to analyze positions\n\n*The analysis uses a perfect solver to evaluate all positions accurately.*"}
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
                disabled={enterMovesDisabled}
                placeholder={enterMovesPlaceholder}
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
