"use client"

import React, { useState, useEffect, MutableRefObject, forwardRef, useImperativeHandle } from "react"
import { motion } from "framer-motion"
import { Layout } from "./mainlayout"
import Board from "../boards/Board"
import { ScoreBar } from "../game/score-bar"
import { PlayerInfo } from "../game/player-info"
import { Timer } from "../game/timer"
import { PlayerData } from "@shared/types/users"
import { BoardHandle } from "../boards/Board"

// Extend window interface for global refresh function
declare global {
  interface Window {
    __gameLayoutRefresh?: () => void
  }
}


interface GameBoardLayoutProps {
  children: React.ReactNode
  boardProps?: {
    interactive?: boolean
    onColumnAttempt?: (col: number) => void
    boardState?: (number | null)[][]
    gameOver?: boolean
    animate_init?: boolean
    ariaLabel?: string
  }
  // Controlled state props for game
  player1Time?: number
  player2Time?: number
  scoreRatio: number
  isGameRunning?: boolean // Keep for backwards compatibility
  isGameRunningRef?: MutableRefObject<boolean> // New ref-based prop
  lastMoveProp?: number | null
  // Callbacks to update parent state
  onPlayer1TimeChange?: (newSeconds: number) => void
  onPlayer2TimeChange?: (newSeconds: number) => void
  onScoreRatioChange?: (newRatio: number) => void
  onPauseGame: () => void
  onResetGame: () => void
  // Ref-based props for player data
  meRef?: MutableRefObject<PlayerData | undefined>
  opponentRef?: MutableRefObject<PlayerData | undefined>
  isRedRef?: MutableRefObject<boolean>
  lastMoveRef?: MutableRefObject<number | null>
  rTimeRef?: MutableRefObject<[number, number]> // [player1Time, player2Time]
  currentTurnRef?: MutableRefObject<number> // Current player's turn (0 or 1)
  // Fallback display props
  player1Name?: string
  player2Name?: string
  player1Pfp?: string
  player2Pfp?: string
  // Display options
  displayScoreBar?: boolean
}

export const GameBoardLayout = forwardRef<BoardHandle, GameBoardLayoutProps>(({
  children,
  boardProps = {},
  player1Time = 300000,
  player2Time = 300000,
  scoreRatio,
  isGameRunning = false,
  isGameRunningRef,
  lastMoveProp,
  onPauseGame,
  onResetGame,
  meRef,
  opponentRef,
  isRedRef,
  lastMoveRef,
  rTimeRef,
  currentTurnRef,
  player1Name = "Opponent",
  player2Name = "Player",
  displayScoreBar = false,
}, ref) => {
  const defaultBoardProps = {
    interactive: true,
    animate_init: false,
    ariaLabel: "Connect 4 game board",
    ...boardProps,
  }

  // Create a ref to the Board component
  const boardRef = React.useRef<BoardHandle>(null)

  // Expose board functions through the ref
  useImperativeHandle(ref, () => ({
    triggerMoveAnimation: (row: number, col: number, player: number) => {
      if (boardRef.current) {
        boardRef.current.triggerMoveAnimation(row, col, player)
      }
    },
    setPremoveCell: (row: number, col: number, player: number) => {
      if (boardRef.current) {
        boardRef.current.setPremoveCell(row, col, player)
      }
    },
    clearPremove: () => {
      if (boardRef.current) {
        boardRef.current.clearPremove()
      }
    },
  }), [])

  // Compute actual player data from refs with fallback values
  // If isRedRef is true, me is red (player 2), opponent is yellow (player 1)
  // If isRedRef is false, me is yellow (player 1), opponent is red (player 2)
  const isRed = isRedRef?.current ?? true
  
  const actualPlayer1Name = (opponentRef?.current?.username || player1Name || "Opponent")
  const actualPlayer2Name = (meRef?.current?.username || player2Name || "Player")
  const actualPlayer1Pfp  = (opponentRef?.current?.pfp || undefined) 
  const actualPlayer2Pfp  = (meRef?.current?.pfp || undefined)
  
  // Determine colors based on position and isRed
  const actualPlayer1Color = isRed ? "yellow" : "red" // Top player color
  const actualPlayer2Color = isRed ? "red" : "yellow" // Bottom player color

  // Get time data from refs with fallback to props
  const actualPlayer1Time = rTimeRef?.current?.[0] ?? player1Time ?? 300000
  const actualPlayer2Time = rTimeRef?.current?.[1] ?? player2Time ?? 300000
  const actualLastMove = lastMoveRef?.current ?? lastMoveProp ?? null
  const currentTurn = currentTurnRef?.current ?? 0
  
  // Use ref-based game running state if available, otherwise fall back to prop
  const actualIsGameRunning = isGameRunningRef?.current ?? isGameRunning

  // Determine which timer should be running
  // Player 1 (top) timer runs when currentTurn === 0
  // Player 2 (bottom) timer runs when currentTurn === 1
  const isPlayer2TimerRunning = actualIsGameRunning && currentTurn === 0 && isRed
  const isPlayer1TimerRunning = actualIsGameRunning && !isPlayer2TimerRunning

  console.log("TEST CURRENT PLAYER TIMERS: ", isPlayer1TimerRunning, isPlayer2TimerRunning)

  // Register global refresh function for external triggers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__gameLayoutRefresh = () => {
        console.log("🔄 Layout forced refresh triggered")
        // Force a re-render by updating a dummy state
        setIsDesktop(prev => prev)
      }
    }
  }, [])

  // State to track current viewport for lazy loading
  const [isDesktop, setIsDesktop] = useState(false)
  
  // Stable key for component identity across layouts
  const componentKey = "game-ui-singleton"
  
  // Use proper useMemo with all dependencies to recreate only when necessary
  const renderedChildren = React.useMemo(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && typeof child.type !== "string") {
        return React.cloneElement(child as React.ReactElement<any>, {
          key: componentKey, // Stable key to maintain identity
          onPauseGame: onPauseGame,
          onResetGame: onResetGame,
          player1Time: actualPlayer1Time,
          player2Time: actualPlayer2Time,
          scoreRatio: scoreRatio,
          isGameRunning: actualIsGameRunning, // Use the actual game running state
        })
      }
      return child
    })
  }, [children, onPauseGame, onResetGame, actualPlayer1Time, actualPlayer2Time, scoreRatio, actualIsGameRunning])

  // Refs for the containers
  const desktopContainerRef = React.useRef<HTMLDivElement>(null)
  const mobileContainerRef = React.useRef<HTMLDivElement>(null)
  const childrenContainerRef = React.useRef<HTMLDivElement>(null)

  // Check viewport size and update state
  React.useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint is 1024px
    }
    
    checkViewport()
    window.addEventListener('resize', checkViewport)
    
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // Move the children container to the appropriate parent
  React.useEffect(() => {
    const childrenContainer = childrenContainerRef.current
    const targetContainer = isDesktop ? desktopContainerRef.current : mobileContainerRef.current
    
    if (childrenContainer && targetContainer) {
      targetContainer.appendChild(childrenContainer)
    }
  }, [isDesktop])

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-screen-2xl mx-auto">
          {/* Desktop Layout (lg breakpoint and above) */}
          <div className="hidden lg:flex lg:items-start lg:gap-8 min-h-[90vh]">
            {/* Left Section: Score Bar + Board Area - Fixed width based on viewport */}
            <div className="flex items-start">
              {/* Score Bar */}
              <div className="flex flex-col items-center justify-center px-4">
                <ScoreBar scoreRatio={scoreRatio} topRed={!isRed} className="w-6 h-[90vh]" display={displayScoreBar} />
              </div>
              
              {/* Board Section - Fixed aspect ratio */}
              <div className="flex flex-col justify-between py-8 ml-4" style={{ width: 'min(70vh, 60vw)', height: '90vh' }}>
                {/* Player 1 Info and Timer (Top) */}
                <div className="flex justify-between items-center w-full mb-4 flex-shrink-0">
                  <PlayerInfo name={actualPlayer1Name} playerColor={actualPlayer1Color} profilePicUrl={actualPlayer1Pfp} />
                  <Timer
                    millisecondsLeft={actualPlayer1Time}
                    lastMoveTimestamp={actualLastMove || undefined}
                    isRunning={isPlayer1TimerRunning}
                    color={actualPlayer1Color}
                  />
                </div>

                {/* Board - Perfect square, constrained by available height */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="aspect-square h-full max-w-full">
                    <Board {...defaultBoardProps} ref={boardRef} className="w-full h-full" />
                  </div>
                </div>

                {/* Player 2 Info and Timer (Bottom) */}
                <div className="flex justify-between items-center w-full mt-4 flex-shrink-0">
                  <PlayerInfo name={actualPlayer2Name} playerColor={actualPlayer2Color} profilePicUrl={actualPlayer2Pfp} />
                  <Timer
                    millisecondsLeft={actualPlayer2Time}
                    lastMoveTimestamp={actualLastMove || undefined}
                    isRunning={isPlayer2TimerRunning}
                    color={actualPlayer2Color}
                  />
                </div>
              </div>
            </div>

            {/* Right Section: Side Component - Takes remaining space */}
            <div className="flex-1 min-w-0">
              <motion.div
                className="bg-brand-secondary rounded-3xl p-8 lg:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                ref={desktopContainerRef}
              >
              </motion.div>
            </div>
          </div>

          {/* Mobile/Tablet Layout (lg:hidden) */}
          <div className="lg:hidden w-full flex flex-col items-center">
            {/* Game Area */}
            <div className="flex-[3] flex min-h-0 w-full max-w-4xl">
              {/* Score Bar */}
              <div className="flex flex-col items-center justify-center px-2">
                <ScoreBar scoreRatio={scoreRatio} topRed={!isRed} className="w-4 h-[calc(75vh-8rem)]" display={displayScoreBar} />
              </div>

              {/* Board + Player Info */}
              <div className="flex-1 flex flex-col justify-between py-4 px-2 min-w-0">
                <div className="flex justify-between items-center w-full flex-shrink-0">
                  <PlayerInfo name={actualPlayer1Name} playerColor={actualPlayer1Color} profilePicUrl={actualPlayer1Pfp} />
                  <Timer
                    millisecondsLeft={actualPlayer1Time}
                    lastMoveTimestamp={actualLastMove || undefined}
                    isRunning={isPlayer1TimerRunning}
                    color={actualPlayer1Color}
                  />
                </div>

                <div className="flex-1 flex items-center justify-center w-full py-2 min-h-0">
                  <div className="aspect-square w-full max-h-full">
                    <Board {...defaultBoardProps} ref={boardRef} className="w-full h-full" />
                  </div>
                </div>

                <div className="flex justify-between items-center w-full flex-shrink-0">
                  <PlayerInfo name={actualPlayer2Name} playerColor={actualPlayer2Color} profilePicUrl={actualPlayer2Pfp} />
                  <Timer
                    millisecondsLeft={actualPlayer2Time}
                    lastMoveTimestamp={actualLastMove || undefined}
                    isRunning={isPlayer2TimerRunning}
                    color={actualPlayer2Color}
                  />
                </div>
              </div>
            </div>

            {/* Side Component - Mobile */}
            <div className="flex-shrink-0 px-4 pb-4 w-full max-w-4xl">
              <motion.div
                className="bg-brand-secondary rounded-3xl p-6 lg:p-8 shadow-2xl border border-brand-border/40 select-none flex flex-col mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                ref={mobileContainerRef}
              >
              </motion.div>
            </div>
          </div>

          {/* Single children container that gets moved between layouts */}
          <div className="flex flex-col" key={componentKey} ref={childrenContainerRef}>
            {renderedChildren}
          </div>
        </div>
      </div>
    </Layout>
  )
})

GameBoardLayout.displayName = "GameBoardLayout"