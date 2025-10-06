"use client"

import { useRef, useImperativeHandle, forwardRef, useEffect } from "react"
import { BaseGameUI, BaseGameUIProps, GameUIRef } from "./BaseGameUI"
import GameChat, { ChatRef } from "@/components/game/utility/chat"
import { BotPlay } from "@/components/game/utility/bot-play"
import { ChatMessage } from "@shared/types/Websocket"
import { PlayerData } from "@shared/types/users"
import { TimedStandardGame } from "@shared/utils/Games/timed-game"
import { logger } from '@/utils/logger'

export interface LiveGameRef extends GameUIRef {
  addChatMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  addSystemMessage: (message: string, username?: string) => void
  addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  clearChat: () => void
  // Bot-specific methods
  sendBotMessage?: (message: string) => void
}

interface LiveGameWithAnalysisProps extends Omit<BaseGameUIProps, 'children'> {
  // Legacy props for backward compatibility (unused but kept for API compatibility)
  onStartGame?: () => void
  onPauseGame?: () => void
  onResetGame?: () => void
  onScoreRatioChange?: (newRatio: number) => void
  player1Time?: number
  player2Time?: number
  scoreRatio?: number
  isGameRunning?: boolean
  
  // Chat-specific props
  initialChatMessages?: ChatMessage[]
  onMessageSent?: (message: ChatMessage) => void
  
  // Bot-specific props (for backward compatibility when isBotMode=true)
  onHint?: () => void
  botName?: string
  botAvatar?: string
}

const LiveGameWithAnalysis = forwardRef<LiveGameRef, LiveGameWithAnalysisProps>((props, ref) => {
  const {
    initialChatMessages = [],
    onMessageSent,
    onHint,
    botName,
    botAvatar,
    isBotMode = false,
    meRef,
    opponentRef,
    currentUser = "You",
    // Extract base props to pass to BaseGameUI
    game,
    currentMoveIndex,
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
    showAnalysisFeatures,
    drawOfferedBy,
    isRedPlayer,
    highlightOfferDraw,
    // Ignore legacy props that are no longer used
    ...legacyProps
  } = props

  const chatRef = useRef<ChatRef>(null)
  
  // Use refs for dynamic data or fallback to props
  const actualCurrentUser = meRef?.current?.username || currentUser
  
  // Get bot info if in bot mode
  const actualBotName = botName || opponentRef?.current?.username || "Bot"
  const actualBotAvatar = botAvatar || opponentRef?.current?.pfp
  
  const handleMessageSent = (message: ChatMessage) => {
    logger.ui("Message sent via chat component:", message)
    onMessageSent?.(message)
  }

  const handleHint = () => {
    logger.bot('BOT: Hint requested')
    onHint?.()
  }

  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  // Expose chat functions to parent component following the same API
  useImperativeHandle(ref, () => ({
    addChatMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => {
      if (isBotMode) {
        logger.bot("Chat message ignored in bot mode:", message)
        return
      }
      chatRef.current?.sendMessage(message, username, type, color)
    },
    addSystemMessage: (message: string, username?: string) => {
      if (isBotMode) {
        logger.bot("System message ignored in bot mode:", message)
        return
      }
      chatRef.current?.addSystemMessage(message, username)
    },
    addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => {
      if (isBotMode) {
        logger.bot("Received message ignored in bot mode:", message)
        return
      }
      chatRef.current?.addReceivedMessage(message, username, type, color)
    },
    clearChat: () => {
      if (isBotMode) {
        logger.bot('BOT: Clear chat ignored in bot mode')
        return
      }
      chatRef.current?.clearMessages()
    },
    sendBotMessage: (message: string) => {
      logger.bot("Sending bot message:", message)
      // This could be extended to manage bot messages if needed
    }
  }), [isBotMode])

  return (
    <BaseGameUI
      game={game}
      meRef={meRef}
      opponentRef={opponentRef}
      currentUser={currentUser}
      currentMoveIndex={currentMoveIndex}
      movesOverride={movesOverride}
      onMoveClick={onMoveClick}
      onFirstMove={onFirstMove}
      onPreviousMove={onPreviousMove}
      onNextMove={onNextMove}
      onLastMove={onLastMove}
      onResign={onResign}
      onOfferDraw={onOfferDraw}
      onAcceptDraw={onAcceptDraw}
      onToggleAnalysis={onToggleAnalysis}
      onSettingsClick={onSettingsClick}
      showAnalysisFeatures={showAnalysisFeatures}
      drawOfferedBy={drawOfferedBy}
      isRedPlayer={isRedPlayer}
      highlightOfferDraw={highlightOfferDraw}
      isBotMode={isBotMode}
    >
      {/* Content slot - either chat or bot play */}
      {isBotMode ? (
        <BotPlay 
          botName={actualBotName}
          botAvatar={actualBotAvatar}
          onHint={handleHint}
          onResign={onResign}
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
    </BaseGameUI>
  )
})


LiveGameWithAnalysis.displayName = "LiveGameWithAnalysis"
export default LiveGameWithAnalysis