"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { motion } from "framer-motion"
import { Layout } from "./mainlayout"
import Board, { BoardHandle } from "../boards/Board"
import { ScoreBar } from "../game/score-bar"
import { PlayerInfo } from "../game/player-info"
import { Timer } from "../game/timer"
import { PlayerData } from "@shared/types/users"

// Clean, focused interface for the unified layout
export interface UnifiedGameLayoutProps {
  children: React.ReactNode
  
  // Board Configuration
  board?: {
    interactive?: boolean
    onColumnAttempt?: (col: number) => void
    boardState?: (number | null)[][]
    gameOver?: boolean
    animate_init?: boolean
    ariaLabel?: string
    showBoard?: boolean // Toggle board visibility
    key?: string // External key for forcing re-renders
  }
  
  // Game State (simplified - use either refs OR direct values)
  gameState?: {
    // Option 1: Direct values (simple mode)
    scoreRatio?: number
    isGameRunning?: boolean
    
    // Option 2: Ref-based values (advanced mode)
    scoreRatioRef?: React.MutableRefObject<number>
    isGameRunningRef?: React.MutableRefObject<boolean>
    
    // Player data
    player1?: PlayerData | React.MutableRefObject<PlayerData | undefined>
    player2?: PlayerData | React.MutableRefObject<PlayerData | undefined>
    
    // Timing
    player1Time?: number | React.MutableRefObject<number>
    player2Time?: number | React.MutableRefObject<number>
    currentTurn?: number | React.MutableRefObject<number> // 0 or 1
    lastMoveTimestamp?: number | React.MutableRefObject<number> // Unix timestamp of last move
    
    // Positioning
    player1IsRed?: boolean | React.MutableRefObject<boolean>
    
    // Disconnect tracking
    player1DisconnectedRef?: React.MutableRefObject<boolean>
    player2DisconnectedRef?: React.MutableRefObject<boolean>
  }
  
  // Layout Configuration
  layout?: {
    mode?: "full-game" | "simple" // Full game mode or simple board + content
    showScoreBar?: boolean
    showTimers?: boolean
    showPlayerInfo?: boolean
    headerText?: string // New: Header text between top player and timer
    contentRatio?: "50%" | "66%" // Board vs content ratio
  }
  
  // Event Handlers
  onTimeUp?: () => void
  onBoardReady?: () => void
}

// Ref interface for board control
export interface UnifiedGameLayoutRef extends BoardHandle {}

// Helper function to extract value from either direct value or ref
function useValueOrRef<T>(valueOrRef: T | React.MutableRefObject<T> | undefined, fallback: T): T {
  const [, forceRender] = useState({})
  
  // Force re-render when ref values might have changed
  useEffect(() => {
    const interval = setInterval(() => forceRender({}), 100)
    return () => clearInterval(interval)
  }, [])
  
  if (valueOrRef && typeof valueOrRef === 'object' && 'current' in valueOrRef) {
    return (valueOrRef as React.MutableRefObject<T>).current ?? fallback
  }
  return (valueOrRef as T) ?? fallback
}

// Helper to extract player data
function usePlayerData(playerOrRef: PlayerData | React.MutableRefObject<PlayerData | undefined> | undefined, fallbackName: string): PlayerData {
  const fallbackPlayer: PlayerData = { username: fallbackName, time: 300000 }
  
  if (!playerOrRef) return fallbackPlayer
  
  if ('current' in playerOrRef) {
    return playerOrRef.current ?? fallbackPlayer
  }
  
  return playerOrRef as PlayerData
}

export const UnifiedGameLayout = forwardRef<UnifiedGameLayoutRef, UnifiedGameLayoutProps>(({
  children,
  board = {},
  gameState = {},
  layout = {},
  onTimeUp,
  onBoardReady,
}, ref) => {
  // Hydration safety
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => setHasMounted(true), [])
  
  // Board ref for forwarding
  const boardRef = useRef<BoardHandle>(null)
  
  // Expose board methods through ref
  useImperativeHandle(ref, () => ({
    triggerMoveAnimation: (row: number, col: number, player: number) => {
      boardRef.current?.triggerMoveAnimation(row, col, player)
    },
    setPremoveCell: (row: number, col: number, player: number) => {
      boardRef.current?.setPremoveCell(row, col, player)
    },
    clearPremove: () => {
      boardRef.current?.clearPremove()
    },
    undoMoveAnimation: (row: number, col: number, player: number) => {
      boardRef.current?.undoMoveAnimation(row, col, player)
    }
  }), [])
  
  // Extract configuration with defaults
  const {
    mode = "simple",
    showScoreBar = false,
    showTimers = false,
    showPlayerInfo = false,
    headerText,
    contentRatio = "66%"
  } = layout
  
  const {
    showBoard = true,
    interactive = false,
    animate_init = false,
    ariaLabel = "Connect 4 game board",
    key: boardKey,
    ...boardProps
  } = board
  
  // Extract game state using helper functions
  const scoreRatio = useValueOrRef(gameState.scoreRatioRef || gameState.scoreRatio, 0.5)
  const isGameRunning = useValueOrRef(gameState.isGameRunningRef || gameState.isGameRunning, false)
  const player1Time = useValueOrRef(gameState.player1Time, 300000)
  const player2Time = useValueOrRef(gameState.player2Time, 300000)
  const currentTurn = useValueOrRef(gameState.currentTurn, 0)
  const player1IsRed = useValueOrRef(gameState.player1IsRed, false)
  const lastMoveTimestamp = useValueOrRef(gameState.lastMoveTimestamp, 0)
  
  const player1Data = usePlayerData(gameState.player1, "Player 1")
  const player2Data = usePlayerData(gameState.player2, "Player 2")
  
  // Determine player colors and timer states
  const player1Color = player1IsRed ? "red" : "yellow"
  const player2Color = player1IsRed ? "yellow" : "red"
  const isPlayer1TimerRunning = showTimers && isGameRunning && currentTurn === 0
  const isPlayer2TimerRunning = showTimers && isGameRunning && currentTurn === 1
  
  // Responsive state
  const [isDesktop, setIsDesktop] = useState(false)
  
  useEffect(() => {
    const checkViewport = () => setIsDesktop(window.innerWidth >= 1024)
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])
  
  // Board ready callback
  useEffect(() => {
    if (hasMounted && boardRef.current) {
      onBoardReady?.()
    }
  }, [hasMounted, onBoardReady])
  
  // Default board props
  const defaultBoardProps = {
    interactive,
    animate_init,
    ariaLabel,
    showLastMoveHighlight: mode === "full-game",
    ...boardProps
  }
  
  // Grid class for content ratio
  const gridColsClass = contentRatio === "50%" ? "lg:grid-cols-2" : "lg:grid-cols-[2fr_1fr]"
  
  // Simple mode (like BoardSpaceLayout)
  if (mode === "simple") {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
          <div className="w-full max-w-7xl mx-auto">
            {/* Desktop Layout */}
            <div className={`hidden lg:grid ${gridColsClass} gap-8 xl:gap-16 items-start`}>
              {/* Board Column */}
              {showBoard && (
                <div className="flex justify-center items-center w-full h-full">
                  {hasMounted ? (
                    <Board 
                      key={boardKey}
                      {...defaultBoardProps} 
                      ref={boardRef}
                    />
                  ) : (
                    <div className="w-full max-w-md aspect-square rounded-xl bg-brand-secondary/40 border border-brand-border/30" />
                  )}
                </div>
              )}
              
              {/* Content Column */}
              <div className={`w-full ${!showBoard ? "lg:col-span-2" : ""}`}>
                <motion.div
                  className="bg-brand-secondary rounded-3xl p-8 lg:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
            
            {/* Mobile Layout */}
            <div className="lg:hidden space-y-6">
              {showBoard && (
                <div className="flex justify-center">
                  {hasMounted ? (
                    <Board 
                      key={boardKey}
                      {...defaultBoardProps} 
                      ref={boardRef}
                      className="max-w-sm"
                    />
                  ) : (
                    <div className="w-full max-w-sm aspect-square rounded-xl bg-brand-secondary/40 border border-brand-border/30" />
                  )}
                </div>
              )}
              
              <div className="w-full max-w-lg mx-auto">
                <motion.div
                  className="bg-brand-secondary rounded-3xl p-6 lg:p-8 shadow-2xl border border-brand-border/40 select-none flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
  
  // Full game mode (like GameBoardLayout)
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-screen-2xl mx-auto">
          {/* Desktop Layout */}
          {hasMounted && isDesktop && (
            <div className="flex lg:items-start lg:gap-8 min-h-[90vh]">
              {/* Game Section */}
              <div className="flex items-start">
                {/* Score Bar */}
                {showScoreBar && (
                  <div className="flex flex-col items-center justify-center px-4">
                    <ScoreBar 
                      scoreRatio={scoreRatio} 
                      topRed={player1IsRed} 
                      className="w-6 h-[90vh]" 
                      display={true} 
                    />
                  </div>
                )}
                
                {/* Board Section */}
                <div className={`flex flex-col justify-between py-8 ${showScoreBar ? 'ml-4' : ''}`} 
                     style={{ width: 'min(70vh, 60vw)', height: '90vh' }}>
                  
                  {/* Top Player Section */}
                  {showPlayerInfo && (
                    <div className="flex justify-between items-center w-full mb-4 flex-shrink-0">
                      <PlayerInfo 
                        name={player1Data.username} 
                        playerColor={player1Color} 
                        profilePicUrl={player1Data.pfp} 
                      />
                      
                      {/* Header Text */}
                      {headerText && (
                        <div className="flex-1 text-center mx-4">
                          <h2 className="text-white text-lg font-semibold">{headerText}</h2>
                        </div>
                      )}
                      
                      {showTimers && (
                        <Timer
                          millisecondsLeft={player1Time}
                          isRunning={isPlayer1TimerRunning}
                          color={player1Color}
                          lastMoveTimestamp={lastMoveTimestamp}
                          onTimeUp={onTimeUp}
                          disconnectedRef={gameState.player1DisconnectedRef}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Board */}
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="aspect-square h-full max-w-full">
                      {showBoard && (
                        <Board 
                          key={boardKey}
                          {...defaultBoardProps} 
                          ref={boardRef} 
                          className="w-full h-full" 
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Player Section */}
                  {showPlayerInfo && (
                    <div className="flex justify-between items-center w-full mt-4 flex-shrink-0">
                      <PlayerInfo 
                        name={player2Data.username} 
                        playerColor={player2Color} 
                        profilePicUrl={player2Data.pfp} 
                      />
                      
                      {/* Spacer for header text alignment */}
                      {headerText && <div className="flex-1 mx-4" />}
                      
                      {showTimers && (
                        <Timer
                          millisecondsLeft={player2Time}
                          isRunning={isPlayer2TimerRunning}
                          color={player2Color}
                          lastMoveTimestamp={lastMoveTimestamp}
                          onTimeUp={onTimeUp}
                          disconnectedRef={gameState.player2DisconnectedRef}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Section */}
              <div className="flex-1 min-w-0">
                <motion.div
                  className="bg-brand-secondary rounded-3xl p-8 lg:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col h-full"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          )}
          
          {/* Mobile Layout */}
          {(!hasMounted || !isDesktop) && (
            <div className="w-full flex flex-col items-center">
              {/* Game Area */}
              <div className="flex-[3] flex min-h-0 w-full max-w-4xl">
                {/* Score Bar */}
                {showScoreBar && (
                  <div className="flex flex-col items-center justify-center px-2">
                    <ScoreBar 
                      scoreRatio={scoreRatio} 
                      topRed={player1IsRed} 
                      className="w-4 h-[calc(75vh-8rem)]" 
                      display={true} 
                    />
                  </div>
                )}
                
                {/* Board + Player Info */}
                <div className="flex-1 flex flex-col justify-between py-4 px-2 min-w-0">
                  {/* Top Player */}
                  {showPlayerInfo && (
                    <div className="flex flex-col items-center w-full flex-shrink-0 mb-2">
                      {headerText && (
                        <h2 className="text-white text-sm font-semibold mb-2">{headerText}</h2>
                      )}
                      <div className="flex justify-between items-center w-full">
                        <PlayerInfo 
                          name={player1Data.username} 
                          playerColor={player1Color} 
                          profilePicUrl={player1Data.pfp} 
                        />
                        {showTimers && (
                          <Timer
                            millisecondsLeft={player1Time}
                            isRunning={isPlayer1TimerRunning}
                            color={player1Color}
                            lastMoveTimestamp={lastMoveTimestamp}
                            onTimeUp={onTimeUp}
                            disconnectedRef={gameState.player1DisconnectedRef}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Board */}
                  <div className="flex-1 flex items-center justify-center w-full py-2 min-h-0">
                    <div className="aspect-square w-full max-h-full">
                      {showBoard && (
                        <Board 
                          key={boardKey}
                          {...defaultBoardProps} 
                          ref={boardRef} 
                          className="w-full h-full" 
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Player */}
                  {showPlayerInfo && (
                    <div className="flex justify-between items-center w-full flex-shrink-0 mt-2">
                      <PlayerInfo 
                        name={player2Data.username} 
                        playerColor={player2Color} 
                        profilePicUrl={player2Data.pfp} 
                      />
                      {showTimers && (
                        <Timer
                          millisecondsLeft={player2Time}
                          isRunning={isPlayer2TimerRunning}
                          color={player2Color}
                          lastMoveTimestamp={lastMoveTimestamp}
                          onTimeUp={onTimeUp}
                          disconnectedRef={gameState.player2DisconnectedRef}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Section - Mobile */}
              <div className="flex-shrink-0 px-4 pb-4 w-full max-w-4xl">
                <motion.div
                  className="bg-brand-secondary rounded-3xl p-6 lg:p-8 shadow-2xl border border-brand-border/40 select-none flex flex-col mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                >
                  {children}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
})

UnifiedGameLayout.displayName = "UnifiedGameLayout"
