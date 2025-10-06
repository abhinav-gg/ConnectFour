"use client"

import { useState, useRef, useImperativeHandle, forwardRef, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility/move-history"
import { GameControls } from "@/components/game/utility/game-controls"
import { GameActions } from "@/components/game/utility/game-actions"
import { ChatMessage } from "@shared/types/Websocket"
import { PlayerData } from "@shared/types/users"
import { TimedStandardGame } from "@shared/utils/Games/timed-game"
import { logger } from '@/utils/logger'

/**
 * Shared interface for the reusable GameUI component
 */
export interface BaseGameUIProps {
  // Game Data
  game?: TimedStandardGame
  meRef?: React.MutableRefObject<PlayerData | undefined>
  opponentRef?: React.MutableRefObject<PlayerData | undefined>
  currentUser?: string
  currentMoveIndex?: number
  movesOverride?: number[]
  
  // Move History & Navigation
  onMoveClick?: (moveIndex: number) => void
  onFirstMove?: () => void
  onPreviousMove?: () => void
  onNextMove?: () => void
  onLastMove?: () => void
  
  // Game Actions
  onResign?: () => void
  onOfferDraw?: () => void
  onAcceptDraw?: () => void
  
  // Analysis Controls
  onToggleAnalysis?: (enabled: boolean) => void
  onSettingsClick?: () => void
  showAnalysisFeatures?: boolean
  
  // Draw State
  drawOfferedBy?: number | null
  isRedPlayer?: boolean
  highlightOfferDraw?: boolean
  
  // Content Slot - This is where chat or bot-play gets inserted
  children: ReactNode
  
  // Mode Detection
  isBotMode?: boolean
}

/**
 * Ref interface for the reusable GameUI component
 */
export interface GameUIRef {
  // Chat methods (for LiveGameUI to expose)
  addChatMessage?: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  addSystemMessage?: (message: string, username?: string) => void
  addReceivedMessage?: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  clearChat?: () => void
  
  // Bot methods (for BotGameUI to expose)
  sendBotMessage?: (message: string) => void
}

/**
 * Reusable GameUI component that provides the standard layout with:
 * - Analysis Header
 * - Column Analysis (when enabled)
 * - Move History
 * - Content slot (for chat or bot-play)
 * - Game Actions (when not in bot mode)
 * - Game Controls
 */
export const BaseGameUI = forwardRef<GameUIRef, BaseGameUIProps>((props, ref) => {
  const {
    game,
    meRef,
    opponentRef,
    currentUser = "You",
    currentMoveIndex: propCurrentMoveIndex = 0,
    movesOverride,
    onMoveClick,
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove,
    onResign,
    onOfferDraw,
    onAcceptDraw,
    onToggleAnalysis,
    onSettingsClick,
    showAnalysisFeatures = true,
    drawOfferedBy = null,
    isRedPlayer = false,
    highlightOfferDraw = false,
    children,
    isBotMode = false,
  } = props

  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)
  
  // Use refs for dynamic data or fallback to props
  const actualCurrentUser = meRef?.current?.username || currentUser
  const actualTotalMoveCount = game ? game.getMoves().length : 0
  
  // Forward ref methods (will be implemented by wrapper components)
  useImperativeHandle(ref, () => ({}), [])

  const handleResign = () => {
    logger.game('Player resigned')
    onResign?.()
  }

  const handleOfferDraw = () => {
    logger.game('Draw offered')
    onOfferDraw?.()
  }

  const handleAcceptDraw = () => {
    logger.game('Draw accepted')
    onAcceptDraw?.()
  }

  const handleToggleAnalysis = (enabled: boolean) => {
    if (showAnalysisFeatures) {
      setIsAnalysisEnabled(enabled)
      onToggleAnalysis?.(enabled)
    }
  }

  const handleSettingsClick = () => {
    logger.ui('Settings clicked')
    onSettingsClick?.()
  }

  const handleMoveClick = (moveIndex: number) => {
    logger.game('Move clicked:', moveIndex)
    onMoveClick?.(moveIndex)
  }

  return (
    <div className="flex-1 flex flex-col text-white">
      {/* Analysis Header - Fixed Height */}
      <div className="flex-shrink-0">
        <AnalysisHeader
          isAnalysisEnabled={isAnalysisEnabled}
          onToggleAnalysis={handleToggleAnalysis}
          onSettingsClick={handleSettingsClick}
          showAnalysisToggle={showAnalysisFeatures}
        />
      </div>

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
              <ColumnAnalysis />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Move History - Fixed Height */}
      <div className="flex-shrink-0 h-[220px]">
        {game ? (
          <MoveHistory game={game} onMoveClick={handleMoveClick} moves={movesOverride} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No game data available
          </div>
        )}
      </div>

      {/* Content Slot - Takes remaining space with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* Game Controls - Fixed Height */}
      <div className="flex-shrink-0 mt-4 space-y-4">
        {!isBotMode && (
          <GameActions
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onAcceptDraw={handleAcceptDraw}
            highlightOfferDraw={highlightOfferDraw}
            isDrawOffered={drawOfferedBy !== null}
            canResign={true}
            canOfferDraw={drawOfferedBy === null}
            drawOfferedBy={drawOfferedBy}
            isRedPlayer={isRedPlayer}
          />
        )}
        <GameControls
          onFirstMove={onFirstMove}
          onPreviousMove={onPreviousMove}
          onNextMove={onNextMove}
          onLastMove={onLastMove}
          totalMoveCount={actualTotalMoveCount}
          currentMoveIndex={propCurrentMoveIndex}
        />
      </div>
    </div>
  )
})

BaseGameUI.displayName = "BaseGameUI"