"use client"

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnalysisHeader } from "@/components/game/utility/analysis-header"
import { ColumnAnalysis } from "@/components/game/utility/column-analysis"
import { MoveHistory } from "@/components/game/utility//move-history"
import GameChat, { ChatMessage, ChatRef } from "@/components/game/utility/chat"
import { GameControls } from "@/components/game/utility/game-controls"

export interface LiveGameRef {
  addChatMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  addSystemMessage: (message: string, username?: string) => void
  addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => void
  clearChat: () => void
}

interface Move {
  column: number
  player: "red" | "yellow"
  moveNumber: number
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
  moves?: Move[]
  currentUser?: string
  
  // Event Handlers
  onMessageSent?: (message: ChatMessage) => void
  onMoveClick?: (moveIndex: number) => void
  onFirstMove?: () => void
  onPreviousMove?: () => void
  onNextMove?: () => void
  onLastMove?: () => void
  onResign?: () => void
  onOfferDraw?: () => void
  onToggleAnalysis?: (enabled: boolean) => void
  onSettingsClick?: () => void
  
  // Analysis Control
  showAnalysisFeatures?: boolean // New prop to control analysis visibility
}

export const LiveGameWithAnalysis = forwardRef<LiveGameRef, LiveGameWithAnalysisProps>((props, ref) => {
  const {
    initialChatMessages = [], // Default to empty array here instead of in JSX
    moves,
    currentUser = "You",
    onMessageSent,
    onMoveClick,
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove,
    onResign,
    onOfferDraw,
    onToggleAnalysis,
    onSettingsClick,
    showAnalysisFeatures = true, // Default to true for backward compatibility
  } = props

  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [maxMoves] = useState(moves?.length || 16) // Use actual moves length or default
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState(true)
  const chatRef = useRef<ChatRef>(null)
  const [chatUid] = useState(() => `chat-uid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  console.log("🆔 GameChat: Component mounted with UID:", chatUid)


  const handleMessageSent = (message: ChatMessage) => {
    console.log("Message sent via chat component:", message)
    onMessageSent?.(message)
  }

  useEffect(() => {
    
    if (!chatRef.current) {
      // chatRef.current = {
      //   addChatMessage: (message, username, type, color) => {
      //     console.log("Adding chat message:", message, username, type, color)
      //     chatRef.current?.sendMessage(message, username, type, color)
      //   },
      //   addSystemMessage: (message, username) => {
      //     console.log("Adding system message:", message, username)
      //     chatRef.current?.addSystemMessage(message, username)
      //   },
      //   addReceivedMessage: (message, username, type, color) => {
      //     console.log("Adding received message:", message, username, type, color)
      //     chatRef.current?.addReceivedMessage(message, username, type, color)
      //   },
      //   clearMessages: () => {
      //     console.log("Clearing chat messages")
      //     chatRef.current?.clearMessages()
      //   }
      // }
      console.error("❌ CHAT: chatRef.current is not initialized")
    }
  }, []);

  // Expose chat functions to parent component
  useImperativeHandle(ref, () => ({
    addChatMessage: (message: string, username?: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => {
      chatRef.current?.sendMessage(message, username, type, color)
    },
    addSystemMessage: (message: string, username?: string) => {
      chatRef.current?.addSystemMessage(message, username)
    },
    addReceivedMessage: (message: string, username: string, type?: ChatMessage["type"], color?: ChatMessage["color"]) => {
      chatRef.current?.addReceivedMessage(message, username, type, color)
    },
    clearChat: () => {
      chatRef.current?.clearMessages()
    }
  }), [])

  const handleFirstMove = () => {
    setCurrentMoveIndex(0)
    onFirstMove?.()
  }
  
  const handlePreviousMove = () => {
    const newIndex = Math.max(0, currentMoveIndex - 1)
    setCurrentMoveIndex(newIndex)
    onPreviousMove?.()
  }
  
  const handleNextMove = () => {
    const newIndex = Math.min(maxMoves - 1, currentMoveIndex + 1)
    setCurrentMoveIndex(newIndex)
    onNextMove?.()
  }
  
  const handleLastMove = () => {
    setCurrentMoveIndex(maxMoves - 1)
    onLastMove?.()
  }

  const handleResign = () => {
    console.log("Player resigned")
    onResign?.()
  }

  const handleOfferDraw = () => {
    console.log("Draw offered")
    onOfferDraw?.()
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
          analysisType="M42"
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
        <MoveHistory moves={moves} onMoveClick={handleMoveClick} />
      </div>

      {/* Chat Section - Takes remaining space with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GameChat 
          ref={chatRef}
          initialMessages={initialChatMessages}
          onMessageSent={handleMessageSent} 
          currentUser={currentUser} 
        />
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
})
