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
  scoreRatio: number
  isGameRunningRef?: MutableRefObject<boolean> // New ref-based prop
  lastMoveProp?: number | null
  // Callbacks to update parent state
  onPlayer1TimeChange?: (newSeconds: number) => void
  onPlayer2TimeChange?: (newSeconds: number) => void
  onScoreRatioChange?: (newRatio: number) => void
  onPauseGame: () => void
  onResetGame: () => void
  onTimeUp?: () => void // Called when either player's time runs out
  // Ref-based props for player data
  meRef?: MutableRefObject<PlayerData | undefined>
  opponentRef?: MutableRefObject<PlayerData | undefined>
  isRedRef?: MutableRefObject<boolean>
  lastMoveRef?: MutableRefObject<number | null>
  rTimeRef?: MutableRefObject<[number, number]> // [player1Time, player2Time]
  currentTurnRef?: MutableRefObject<number> // Current player's turn (0 or 1)
  myGameRef?: MutableRefObject<any> // Reference to the game instance for move management
  // Fallback display props
  player1Pfp?: string
  player2Pfp?: string
  // Display options
  displayScoreBar?: boolean
  // NEW: external version signal and ready callback
  boardVersion?: number
  onBoardReady?: () => void
  // NEW: re-render position (remount Board) only when this changes
  positionVersion?: number
}

function HydrationCheck() {
  const [isClient, setIsClient] = React.useState(false);
  const renderTime = Date.now();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', marginTop: '2rem' }}>
      <p>Hydration Test:</p>
      <p>Is client: {isClient ? '✅ YES' : '❌ NO'}</p>
      <p>Render time: {renderTime}</p>
    </div>
  );
}

export const GameBoardLayout = forwardRef<BoardHandle, GameBoardLayoutProps>(({ 
  children,
  boardProps = {},
  scoreRatio,
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
  myGameRef,
  displayScoreBar = false,
  boardVersion = 0,
  onBoardReady,
  positionVersion = 0,
  onTimeUp,
}, ref) => {
  // Ensure consistent SSR/CSR markup: delay reading refs until after mount
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => setHasMounted(true), [])

  // Add state to track when myGameRef changes to trigger re-renders
  const [gameRefVersion, setGameRefVersion] = useState(0)
  const [lastGameRef, setLastGameRef] = useState(myGameRef?.current)
  
  // Effect to track when the game ref actually changes (including new instances)
  useEffect(() => {
    const currentGameRef = myGameRef?.current
    if (currentGameRef !== lastGameRef) {
      setLastGameRef(currentGameRef)
      setGameRefVersion(prev => prev + 1)
      console.log("🔄 GAME BOARD LAYOUT: Game ref changed, triggering board refresh", {
        hasNewRef: !!currentGameRef,
        boardState: (currentGameRef && typeof (currentGameRef as any).getBoard === 'function') ? (currentGameRef as any).getBoard() : undefined
      })
    }
  }) // No dependencies - check every render

  // Use the game ref directly for board state - this will update when versions change
  const boardState = React.useMemo(() => {
    // Safe fallback: return an empty 6x7 board until mounted and a valid game ref with getBoard() exists
    const emptyBoard = Array(6).fill(null).map(() => Array(7).fill(null)) as (number | null)[][]
    if (!hasMounted) return emptyBoard
    if (!myGameRef?.current) {
      console.log("🔄 GAME BOARD LAYOUT: No game ref, using empty board")
      return emptyBoard
    }
    try {
      const maybeGame: any = myGameRef.current
      if (typeof maybeGame.getBoard === 'function') {
        return maybeGame.getBoard()
      }
      console.warn("🔄 GAME BOARD LAYOUT: game ref has no getBoard(), using empty board")
      return emptyBoard
    } catch (e) {
      console.warn("🔄 GAME BOARD LAYOUT: Error reading board from game ref, using empty board", e)
      return emptyBoard
    }
  }, [hasMounted, gameRefVersion, boardVersion])

  const defaultBoardProps = {
    boardState: boardState, // Use the reactive board state
    interactive: true,
    animate_init: false,
    showLastMoveHighlight: true,
    gameOver: hasMounted ? (myGameRef?.current?.gameOver ?? false) : false,
    ariaLabel: "Connect 4 game board",
    ...boardProps, // This can still override if needed
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
    undoMoveAnimation: (row: number, col: number, player: number) => {
      if (boardRef.current) {
        boardRef.current.undoMoveAnimation(row, col, player)
      }
    }
  }), [])

  // Compute actual player data from refs with fallback values
  // If isRedRef is true, me is red (player 2), opponent is yellow (player 1)
  // If isRedRef is false, me is yellow (player 1), opponent is red (player 2)
  const isRed = (hasMounted && isRedRef?.current !== undefined) ? !!isRedRef.current : true
  
  const actualPlayer1Name = (hasMounted && opponentRef?.current?.username) ? opponentRef.current.username : "Opponent"
  const actualPlayer2Name = (hasMounted && meRef?.current?.username) ? meRef.current.username : "Player"
  const actualPlayer1Pfp  = (hasMounted && opponentRef?.current?.pfp) ? opponentRef.current.pfp : undefined
  const actualPlayer2Pfp  = (hasMounted && meRef?.current?.pfp) ? meRef.current.pfp : undefined
  
  // Determine colors based on position and isRed
  const actualPlayer1Color = isRed ? "yellow" : "red" // Top player color
  const actualPlayer2Color = isRed ? "red" : "yellow" // Bottom player color

  // Get time data from refs with fallback to props
  const actualPlayer1Time = hasMounted && rTimeRef?.current ? rTimeRef.current[isRed ? 1 : 0] : 300000
  const actualPlayer2Time = hasMounted && rTimeRef?.current ? rTimeRef.current[isRed ? 0 : 1] : 300000
  const actualLastMove = hasMounted ? (lastMoveRef?.current ?? lastMoveProp ?? null) : null
  const currentTurn = hasMounted ? currentTurnRef?.current : undefined
  
  // Use ref-based game running state if available, otherwise fall back to prop
  const actualIsGameRunning = hasMounted ? !!isGameRunningRef?.current : false

  // Add state variables for timer running states
  const [isPlayer1Running, setIsPlayer1Running] = useState(false)
  const [isPlayer2Running, setIsPlayer2Running] = useState(false)

  // Effect to update timer running states when refs change
  useEffect(() => {
    const isPlayer2TimerRunning = !!(actualIsGameRunning && ((currentTurn === 0 && isRed) || (currentTurn === 1 && !isRed)))
    const isPlayer1TimerRunning = !!(actualIsGameRunning && !isPlayer2TimerRunning)

    setIsPlayer1Running(isPlayer1TimerRunning)
    setIsPlayer2Running(isPlayer2TimerRunning)
  }, [actualIsGameRunning, currentTurn, isRed])

  // State to track current viewport for lazy loading
  // Default to mobile layout during SSR/hydration to avoid blank content
  // Keep SSR/CSR markup stable by not switching layout until after mount
  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  
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

  // Check viewport size and update state
  React.useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint is 1024px
    }
    
    // Only check after mount to keep SSR and initial CSR consistent
    checkViewport()
    window.addEventListener('resize', checkViewport)
    
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // Notify parent when the Board is ready (mounted with a ref)
  useEffect(() => {
    if (boardRef.current) {
      onBoardReady?.()
    }
  }, [onBoardReady, gameRefVersion, positionVersion])

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-screen-2xl mx-auto">
          {/* Desktop Layout (lg breakpoint and above) */}
          {hasMounted && isDesktop && (
            <div className="flex lg:items-start lg:gap-8 min-h-[90vh]">
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
                    {hasMounted ? (
                      <Timer
                        millisecondsLeft={actualPlayer1Time}
                        lastMoveTimestamp={actualLastMove || undefined}
                        isRunning={isPlayer1Running}
                        color={actualPlayer1Color}
                        onTimeUp={onTimeUp}
                      />
                    ) : (
                      <div className="w-28 h-8 rounded-full bg-gray-300/60" aria-hidden />
                    )}
                  </div>

                  {/* Board - Perfect square, constrained by available height */}
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="aspect-square h-full max-w-full">
                      {hasMounted ? (
                        <Board 
                          key={`board-${gameRefVersion}-${positionVersion}`}
                          {...defaultBoardProps} 
                          ref={boardRef} 
                          className="w-full h-full" 
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-brand-secondary/40 border border-brand-border/30" aria-hidden />
                      )}
                    </div>
                  </div>

                  {/* Player 2 Info and Timer (Bottom) */}
                  <div className="flex justify-between items-center w-full mt-4 flex-shrink-0">
                    <PlayerInfo name={actualPlayer2Name} playerColor={actualPlayer2Color} profilePicUrl={actualPlayer2Pfp} />
                    {hasMounted ? (
                      <Timer
                        millisecondsLeft={actualPlayer2Time}
                        lastMoveTimestamp={actualLastMove || undefined}
                        isRunning={isPlayer2Running}
                        color={actualPlayer2Color}
                        onTimeUp={onTimeUp}
                      />
                    ) : (
                      <div className="w-28 h-8 rounded-full bg-gray-300/60" aria-hidden />
                    )}
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
                  {/* Render side children here for desktop */}
                  {renderedChildren}
                </motion.div>
              </div>
            </div>
          )}

          {/* Mobile/Tablet Layout */}
          {(!hasMounted || !isDesktop) && (
            <div className="w-full flex flex-col items-center">
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
                    {hasMounted ? (
                      <Timer
                        millisecondsLeft={actualPlayer1Time}
                        lastMoveTimestamp={actualLastMove || undefined}
                        isRunning={isPlayer1Running}
                        color={actualPlayer1Color}
                        onTimeUp={onTimeUp}
                      />
                    ) : (
                      <div className="w-28 h-8 rounded-full bg-gray-300/60" aria-hidden />
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center w-full py-2 min-h-0">
                    <div className="aspect-square w-full max-h-full">
                      {hasMounted ? (
                        <Board 
                          key={`board-mobile-${gameRefVersion}-${positionVersion}`}
                          {...defaultBoardProps} 
                          ref={boardRef} 
                          className="w-full h-full" 
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-brand-secondary/40 border border-brand-border/30" aria-hidden />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center w-full flex-shrink-0">
                    <PlayerInfo name={actualPlayer2Name} playerColor={actualPlayer2Color} profilePicUrl={actualPlayer2Pfp} />
                    {hasMounted ? (
                      <Timer
                        millisecondsLeft={actualPlayer2Time}
                        lastMoveTimestamp={actualLastMove || undefined}
                        isRunning={isPlayer2Running}
                        color={actualPlayer2Color}
                        onTimeUp={onTimeUp}
                      />
                    ) : (
                      <div className="w-28 h-8 rounded-full bg-gray-300/60" aria-hidden />
                    )}
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
                  {/* Render side children here for mobile */}
                  {renderedChildren}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
})

GameBoardLayout.displayName = "GameBoardLayout"