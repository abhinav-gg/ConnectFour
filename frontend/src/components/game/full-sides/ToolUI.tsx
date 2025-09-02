"use client"

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { remark } from "remark"
import html from "remark-html"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility/move-history"
import { EnterMoves } from "@/components/game/utility/enter-moves"
import { GameControls } from "@/components/game/utility/game-controls"
import { NavigableGame } from '@shared/types/game.types'
import { useGameAnalysis } from "../gameAnalysisService"
import { useGameHistory, GameHistoryAnimations } from "../gameHistoryService"

interface ToolUIProps {
  // Game and Move History Props
  game?: NavigableGame
  gameStateVersion?: number // Version number to detect game state changes
  
  // Simple setup - just provide the layout ref and bump function for animations
  layoutRef?: React.MutableRefObject<any>
  onBump?: () => void
  
  // Analysis Control
  showAnalysisFeatures?: boolean
  
  // UI Control
  showEnterMoves?: boolean
  enterMovesPlaceholder?: string
  
  // Event Handlers - simplified
  onToggleAnalysis?: (enabled: boolean) => void
  onSettingsClick?: () => void
  onSubmitMoves?: (moves: number[]) => void
  onColumnClick?: (column: number) => void
}

const ToolUI = forwardRef<any, ToolUIProps>((props, ref) => {
  const {
    game,
    gameStateVersion = 0,
    layoutRef,
    onBump = () => {},
    showAnalysisFeatures = true,
    showEnterMoves = true,
    enterMovesPlaceholder,
    onToggleAnalysis,
    onSettingsClick,
    onSubmitMoves,
    onColumnClick,
  } = props

  // UI State
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)
  const [openingHtml, setOpeningHtml] = useState<string>("")

  // Create a ref for the game to pass to services  
  const gameRef = useRef<NavigableGame | null>(game || null)
  gameRef.current = game || null

  // Use the analysis service for all analysis logic
  const [analysisState, analysisControls] = useGameAnalysis(gameRef, gameStateVersion)

  // Set up game history service with animations - always call useRef at top level
  const defaultLayoutRef = useRef(null)
  const animations: GameHistoryAnimations = {
    layoutRef: layoutRef || defaultLayoutRef,
    onBump
  }
  const gameHistory = useGameHistory(gameRef as React.MutableRefObject<NavigableGame>, animations)

  // Process markdown for opening description
  useEffect(() => {
    const processMarkdown = async () => {
      if (analysisState.isLoadingOpening) {
        setOpeningHtml("<p>Please wait while we fetch the opening data for this position...</p>")
        return
      }
      
      try {
        const result = await remark().use(html).process(analysisState.currentOpening.description)
        setOpeningHtml(result.toString())
      } catch (error) {
        console.error("Error processing markdown:", error)
        setOpeningHtml(`<p>${analysisState.currentOpening.description}</p>`)
      }
    }

    processMarkdown()
  }, [analysisState.currentOpening.description, analysisState.isLoadingOpening])

  // Event handlers
  const handleToggleAnalysis = (enabled: boolean) => {
    if (showAnalysisFeatures) {
      setIsAnalysisEnabled(enabled)
      onToggleAnalysis?.(enabled)
    }
  }

  const handleSettingsClick = () => {
    onSettingsClick?.()
  }

  const handleMoveClick = (moveIndex: number) => {
    gameHistory?.handleMoveClick(moveIndex)
  }

  const handleSubmitMoves = (moves: number[]) => {
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
            isLoading={analysisState.isAnalysisLoading}
            onToggleAnalysis={handleToggleAnalysis}
            onSettingsClick={handleSettingsClick}
            showAnalysisToggle={true}
            evaluation={analysisState.currentEvaluation}
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
                evaluations={analysisState.columnEvaluations}
                isLoading={analysisState.isAnalysisLoading}
                onColumnClick={onColumnClick}
                gameOver={game?.gameOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Move History - Dynamic Height */}
      <div className="flex-shrink-0 mb-4">
        {game ? (
          <MoveHistory 
            game={game} 
            onMoveClick={handleMoveClick} 
          />
        ) : (
          <div className="bg-brand-primary/40 rounded-lg p-4 flex items-center justify-center text-gray-500 min-h-[80px]">
            No game data available
          </div>
        )}
      </div>

      {/* Opening Description - Taller with smaller font */}
      <div className="flex-shrink-0 h-[280px] mb-4">
        <div className="bg-brand-primary/40 rounded-lg p-4 text-white h-full flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-3 flex-shrink-0">
            {analysisState.isLoadingOpening ? "Loading..." : analysisState.currentOpening.name}
          </h3>
          <div className="flex-1 overflow-y-auto">
            <div 
              className="text-slate-200 leading-relaxed text-sm prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: openingHtml }}
            />
          </div>
        </div>
      </div>

      {/* Enter Moves - Reduced space */}
      <div className="flex-shrink-0 h-[120px] mb-4">
        <AnimatePresence>
          {showEnterMoves && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col justify-center p-2"
            >
              <EnterMoves
                onSubmitMoves={handleSubmitMoves}
                placeholder={enterMovesPlaceholder}
                game={game as any} // NavigableGame instances are usually also StandardGame instances
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when enter moves is not shown */}
        {!showEnterMoves && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p className="text-center text-sm">
              No move input available
            </p>
          </div>
        )}
      </div>

      {/* Game Controls - Always at bottom */}
      <div className="flex-shrink-0 pb-2">
        {game && gameHistory && (
          <GameControls
            onFirstMove={gameHistory.handleFirstMove}
            onPreviousMove={gameHistory.handlePreviousMove}
            onNextMove={gameHistory.handleNextMove}
            onLastMove={gameHistory.handleLastMove}
            canGoBack={gameHistory.canGoBack()}
            canGoForward={gameHistory.canGoForward()}
            totalMoveCount={game.getMoves().length}
            currentMoveIndex={game.getCurrentMoveIndex()}
          />
        )}
      </div>
    </div>
  )
})

ToolUI.displayName = "ToolUI"
export default ToolUI
