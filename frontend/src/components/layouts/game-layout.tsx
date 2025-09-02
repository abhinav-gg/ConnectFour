"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { motion } from "framer-motion"
import { Layout } from "./mainlayout"
import Board, { BoardHandle } from "../game/Board"
import { ScoreBar } from "../game/score-bar"
import { PlayerInfo } from "../game/player-info"
import { Timer } from "../game/timer"
import { PlayerData } from "@shared/types/users"
import Loading from "../loading"

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
    showScoreBar?: boolean
    showTimers?: boolean
    showPlayerInfo?: boolean
    headerText?: string // Header text between top player and timer
    contentRatio?: "50%" | "66%" // Board vs content ratio
  }
  
  // Event Handlers
  onTimeUp?: () => void
  onBoardReady?: () => void
}

// Ref interface for board control
export type UnifiedGameLayoutRef = BoardHandle

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
      console.log("🎮 UnifiedGameLayout: Triggering move animation:", { row, col, player })
      boardRef.current?.triggerMoveAnimation(row, col, player)
    },
    setPremoveCell: (row: number, col: number, player: number) => {
      boardRef.current?.setPremoveCell(row, col, player)
    },
    clearPremove: () => {
      boardRef.current?.clearPremove()
    },
    undoMoveAnimation: (row: number, col: number, player: number, lastMoveHighlight?: {row: number, col: number} | null) => {
      console.log("🎮 UnifiedGameLayout: Triggering undomove animation:", { row, col, player })
      boardRef.current?.undoMoveAnimation(row, col, player, lastMoveHighlight)
    },
    setBoard: (newBoard: (number | null)[][]) => {
      boardRef.current?.setBoard(newBoard)
    },
    makeArrow: (startRow: number, startCol: number, endRow: number, endCol: number, id?: string) => {
      return boardRef.current?.makeArrow(startRow, startCol, endRow, endCol, id) || ''
    }
  }), [])
  
  // Extract configuration with defaults
  const {
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
  
  // Fixed timer logic: Red player (turn 0) goes first, Yellow player (turn 1) goes second
  // Determine which player position is red, then activate timer based on currentTurn
  const redPlayerIsPlayer1 = player1IsRed
  const isPlayer1TimerRunning = showTimers && isGameRunning && 
    ((currentTurn === 0 && redPlayerIsPlayer1) || (currentTurn === 1 && !redPlayerIsPlayer1))
  const isPlayer2TimerRunning = showTimers && isGameRunning && 
    ((currentTurn === 0 && !redPlayerIsPlayer1) || (currentTurn === 1 && redPlayerIsPlayer1))
  
  // Responsive state - more granular breakpoints
  const [isDesktop, setIsDesktop] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isMedium, setIsMedium] = useState(false)
  
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth
      setIsDesktop(width >= 1280)
      setIsTablet(width >= 1024 && width < 1280)
      setIsMedium(width >= 649 && width < 1024)
    }
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
    showLastMoveHighlight: true,
    ...boardProps
  }
  
  // Grid class for content ratio
  const gridColsClass = contentRatio === "50%" ? "grid-cols-2" : "grid-cols-[2fr_1fr]"

  // Create unified components - single board and content component
  const unifiedBoardComponent = showBoard && hasMounted ? (
    <Board 
      key={boardKey}
      {...defaultBoardProps} 
      ref={boardRef}
      className="w-full h-full"
    />
  ) : showBoard ? (
    <div className="w-full aspect-square rounded-xl bg-brand-secondary/40 border border-brand-border/30" />
  ) : null

  const unifiedContentComponent = (
    <motion.div
      className="bg-brand-secondary rounded-3xl p-6 lg:p-8 xl:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )

  // Create reusable components for the layout  
  const scoreBarComponent = showScoreBar ? (
    <div className="flex flex-col items-center justify-center px-2 lg:px-4">
      <ScoreBar 
        scoreRatio={scoreRatio} 
        topRed={player1IsRed} 
        className="w-4 lg:w-6 h-[calc(75vh-8rem)] lg:h-[90vh]" 
        display={true} 
      />
    </div>
  ) : null

  const topPlayerComponent = showPlayerInfo ? (
    <div className="flex flex-col w-full mb-2 lg:mb-4 flex-shrink-0">
      {/* Header Text - Always shown above player info */}
      {headerText && (
        <div className="text-center mb-2 lg:mb-3">
          <h2 className="text-white text-sm lg:text-lg font-semibold">{headerText}</h2>
        </div>
      )}
      
      {/* Player info and timer row */}
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
  ) : null

  const bottomPlayerComponent = showPlayerInfo ? (
    <div className="flex justify-between items-center w-full mt-2 lg:mt-4 flex-shrink-0">
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
  ) : null

  const fullGameBoardComponent = showBoard ? (
    <Board 
      key={boardKey}
      {...defaultBoardProps} 
      ref={boardRef} 
      className="w-full h-full" 
    />
  ) : null

  const fullGameContentComponent = (
    <motion.div
      className="bg-brand-secondary rounded-3xl p-6 lg:p-8 xl:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )

  // Full game mode (like GameBoardLayout)
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-screen-2xl lg:max-w-[98vw] mx-auto">
          {/* Unified Layout - Works for both mobile and desktop */}
          {hasMounted && (
            <div className={`flex ${isDesktop || isTablet ? 'flex-row' : 'flex-col'} lg:items-start lg:gap-3 xl:gap-4 ${isDesktop || isTablet ? 'min-h-[90vh]' : 'min-h-screen gap-4'}`}>
              {/* Game Section */}
              <div className={`flex lg:items-start ${isTablet ? 'flex-1' : isDesktop ? 'flex-[2]' : 'flex-none'} lg:flex-initial`}>
                {/* Score Bar */}
                {scoreBarComponent}
                
                {/* Board Section */}
                <div className={`flex flex-col justify-center ${isDesktop || isTablet ? 'py-4 lg:py-8' : 'py-2'} flex-1 lg:flex-initial ${showScoreBar ? 'ml-2 lg:ml-4' : ''}`} 
                     style={{ 
                       width: isDesktop ? 'min(80vh, 75vw)' : isTablet ? 'min(70vh, 45vw)' : '100%', 
                       height: isDesktop ? '90vh' : isTablet ? '85vh' : 'auto'
                     }}>
                  
                  {/* Top Player Section - Fixed height to maintain board space */}
                  <div className="flex-shrink-0 mb-2 lg:mb-4" style={{ height: showPlayerInfo ? 'auto' : '40px' }}>
                    {topPlayerComponent}
                  </div>
                  
                  {/* Board Container - Always square, bounded by smaller dimension */}
                  <div className={`flex-1 flex items-center justify-center ${isDesktop || isTablet ? 'px-2 lg:px-4' : 'px-4 py-4'}`}>
                    <div 
                      className="aspect-square bg-transparent"
                      style={{ 
                        width: isDesktop 
                          ? 'min(calc(90vh - 200px), calc(75vw - 100px))' 
                          : isTablet 
                            ? 'min(calc(85vh - 150px), calc(45vw - 50px))'
                            : isMedium
                              ? 'min(calc(66vw - 40px), calc(70vh - 120px))'
                              : 'min(calc(100vw - 80px), calc(60vh - 100px))',
                        height: isDesktop 
                          ? 'min(calc(90vh - 200px), calc(75vw - 100px))' 
                          : isTablet 
                            ? 'min(calc(85vh - 150px), calc(45vw - 50px))'
                            : isMedium
                              ? 'min(calc(66vw - 40px), calc(70vh - 120px))'
                              : 'min(calc(100vw - 80px), calc(60vh - 100px))',
                        maxWidth: isDesktop ? '600px' : isTablet ? '450px' : isMedium ? '500px' : '320px',
                        maxHeight: isDesktop ? '600px' : isTablet ? '450px' : isMedium ? '500px' : '320px'
                      }}
                    >
                      {unifiedBoardComponent}
                    </div>
                  </div>
                  
                  {/* Bottom Player Section - Fixed height to maintain board space */}
                  <div className="flex-shrink-0 mt-2 lg:mt-4" style={{ height: showPlayerInfo ? 'auto' : '40px' }}>
                    {bottomPlayerComponent}
                  </div>
                </div>
              </div>
              
              {/* Content Section - Responsive without forced min-widths */}
              <div className={`${isTablet ? 'flex-[2]' : isDesktop ? 'flex-[3]' : 'flex-none'} min-w-0 ${isDesktop || isTablet ? 'px-4 lg:px-0 pb-4 lg:pb-0' : 'px-2 pb-8'}`}>
                {unifiedContentComponent}
              </div>
            </div>
          )}
          
          {/* Loading state for SSR */}
          {!hasMounted && (
            <Loading />
          )}
        </div>
      </div>
    </Layout>
  )
})

UnifiedGameLayout.displayName = "UnifiedGameLayout"
