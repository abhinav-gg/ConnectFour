"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility//move-history"
import GameChat from "@/components/game/utility/chat"
import { GameControls } from "@/components/game/utility/game-controls"

interface LiveGameWithAnalysisProps {
  // Props that might be passed from GameBoardLayout
  onStartGame?: () => void
  onPauseGame?: () => void
  onResetGame?: () => void
  onScoreRatioChange?: (newRatio: number) => void
  player1Time?: number
  player2Time?: number
  scoreRatio?: number
  isGameRunning?: boolean
}

export function LiveGameWithAnalysis(props: LiveGameWithAnalysisProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [maxMoves] = useState(16) // Example max moves
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)

  const handleFirstMove = () => setCurrentMoveIndex(0)
  const handlePreviousMove = () => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1))
  const handleNextMove = () => setCurrentMoveIndex(Math.min(maxMoves - 1, currentMoveIndex + 1))
  const handleLastMove = () => setCurrentMoveIndex(maxMoves - 1)

  const handleResign = () => {
    console.log("Player resigned")
  }

  const handleOfferDraw = () => {
    console.log("Draw offered")
  }

  const handleSendMessage = (message: string) => {
    console.log("Message sent:", message)
  }

  const handleSettingsClick = () => {
    console.log("Settings clicked")
  }

  return (
    <div className="flex-1 flex flex-col text-white">
      {/* Analysis Header - Fixed Height */}
      <div className="flex-shrink-0">
        <AnalysisHeader
          analysisType="M42"
          isAnalysisEnabled={isAnalysisEnabled}
          onToggleAnalysis={setIsAnalysisEnabled}
          onSettingsClick={handleSettingsClick}
        />
      </div>

      {/* Column Analysis - Fixed Height when visible */}
      <div className="flex-shrink-0">
        <AnimatePresence>
          {isAnalysisEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <ColumnAnalysis />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Move History - Fixed Height */}
      <div className="flex-shrink-0 h-[220px]">
        <MoveHistory />
      </div>

      {/* Chat Section - Takes remaining space with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GameChat onSendMessage={handleSendMessage} currentUser="You" />
      </div>

      {/* Game Controls - Fixed Height */}
      <div className="flex-shrink-0 mt-4">
        <GameControls
          onFirstMove={handleFirstMove}
          onPreviousMove={handlePreviousMove}
          onNextMove={handleNextMove}
          onLastMove={handleLastMove}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          canGoBack={currentMoveIndex > 0}
          canGoForward={currentMoveIndex < maxMoves - 1}
        />
      </div>
    </div>
  )
}
