"use client"

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility//move-history"
import GameChat, { ChatRef } from "@/components/game/utility/chat"
import { BotPlay } from "@/components/game/utility/bot-play"
import { ChatMessage } from "@shared/types/Websocket"
import { GameControls } from "@/components/game/utility/game-controls"
import { GameActions } from "@/components/game/utility/game-actions"
import { PlayerData } from "@shared/types/users"
import { TimedStandardGame } from "@shared/utils/Games/timed-game"

export interface LiveGameRef {
  addChatMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  addSystemMessage: (message: string, username?: string) => void
  addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  clearChat: () => void
  // Bot-specific methods
  sendBotMessage?: (message: string) => void
}

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
  
  // Chat and Move History Props
  initialChatMessages?: ChatMessage[]
  game?: TimedStandardGame // Direct game integration
  meRef?: React.MutableRefObject<PlayerData | undefined>
  opponentRef?: React.MutableRefObject<PlayerData | undefined> // Added for bot mode
  currentUser?: string
  currentMoveIndex?: number
  // Optional override for the move list to display (e.g., include pending animation)
  movesOverride?: number[]
  
  // Event Handlers
  onMessageSent?: (message: ChatMessage) => void
  onMoveClick?: (moveIndex: number) => void
  onFirstMove?: () => void
  onPreviousMove?: () => void
  onNextMove?: () => void
  onLastMove?: () => void
  onResign?: () => void
  onOfferDraw?: () => void
  onHint?: () => void // Bot-specific hint handler
  onToggleAnalysis?: (enabled: boolean) => void
  onSettingsClick?: () => void
  
  // Analysis Control
  showAnalysisFeatures?: boolean // New prop to control analysis visibility
  
  // Bot Mode Control
  isBotMode?: boolean // New prop to determine if we should show bot UI
  
  // Draw offer state
  drawOfferedBy?: number | null // null, 0, or 1 for which player offered draw
  isRedPlayer?: boolean // Whether the current user is the red player (player 0)
  highlightOfferDraw?: boolean // Whether to highlight the offer draw button
}

const LiveGameWithAnalysis = forwardRef<LiveGameRef, LiveGameWithAnalysisProps>((props, ref) => {
  const {
    initialChatMessages = [], // Default to empty array here instead of in JSX
    game,
    meRef,
    opponentRef,
    currentUser = "You",
    currentMoveIndex: propCurrentMoveIndex = 0,
    movesOverride,
    onMessageSent,
    onMoveClick,
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove,
    onResign,
    onOfferDraw,
    onHint,
    onToggleAnalysis,
    onSettingsClick,
    showAnalysisFeatures = true, // Default to true for backward compatibility
    isBotMode = false, // Default to false
    drawOfferedBy = null,
    isRedPlayer = false,
    highlightOfferDraw = false,
  } = props

  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)
  const chatRef = useRef<ChatRef>(null)
  
  // Use refs for dynamic data or fallback to props
  const actualCurrentUser = meRef?.current?.username || currentUser
  const actualTotalMoveCount = game ? game.getMoves().length : 0
  
  // Get bot info if in bot mode
  const botName = opponentRef?.current?.username || "Bot"
  const botAvatar = opponentRef?.current?.pfp
  
  const handleMessageSent = (message: ChatMessage) => {
    console.log("Message sent via chat component:", message)
    onMessageSent?.(message)
  }

  useEffect(() => {
    
    
  }, []);

  // Expose chat functions to parent component
  useImperativeHandle(ref, () => ({
    addChatMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => {
      if (isBotMode) {
        console.log("🤖 BOT: Chat message ignored in bot mode:", message)
        return
      }
      chatRef.current?.sendMessage(message, username, type, color)
    },
    addSystemMessage: (message: string, username?: string) => {
      if (isBotMode) {
        console.log("🤖 BOT: System message ignored in bot mode:", message)
        return
      }
      chatRef.current?.addSystemMessage(message, username)
    },
    addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => {
      if (isBotMode) {
        console.log("🤖 BOT: Received message ignored in bot mode:", message)
        return
      }
      chatRef.current?.addReceivedMessage(message, username, type, color)
    },
    clearChat: () => {
      if (isBotMode) {
        console.log("🤖 BOT: Clear chat ignored in bot mode")
        return
      }
      chatRef.current?.clearMessages()
    },
    sendBotMessage: (message: string) => {
      console.log("🤖 BOT: Sending bot message:", message)
      // This could be extended to manage bot messages if needed
    }
  }), [isBotMode])

  const handleResign = () => {
    console.log("Player resigned")
    onResign?.()
  }

  const handleOfferDraw = () => {
    console.log("Draw offered")
    onOfferDraw?.()
  }

  const handleHint = () => {
    console.log("🤖 BOT: Hint requested")
    onHint?.()
  }

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
          <MoveHistory game={game} onMoveClick={onMoveClick} moves={movesOverride} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No game data available
          </div>
        )}
      </div>

      {/* Chat or Bot Play Section - Takes remaining space with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isBotMode ? (
          <BotPlay 
            botName={botName}
            botAvatar={botAvatar}
            onHint={handleHint}
            onResign={handleResign}
            className="h-full"
          />
        ) : (
          <GameChat 
            ref={chatRef}
            initialMessages={initialChatMessages}
            onMessageSent={handleMessageSent}
            currentUser={actualCurrentUser} 
          />
        )}
      </div>

      {/* Game Controls - Fixed Height */}
      <div className="flex-shrink-0 mt-4 space-y-4">
        {!isBotMode && (
          <GameActions
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            highlightOfferDraw={highlightOfferDraw}
            isDrawOffered={drawOfferedBy !== null}
            canResign={true}
            canOfferDraw={drawOfferedBy === null}
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


LiveGameWithAnalysis.displayName = "LiveGameWithAnalysis"
export default LiveGameWithAnalysis