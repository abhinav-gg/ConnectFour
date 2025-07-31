"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Layout } from "./mainlayout"
import Board from "../boards/Board"
import { ScoreBar } from "../game/score-bar"
import { PlayerInfo } from "../game/player-info"
import { Timer } from "../game/timer"
import { User2 } from "lucide-react"

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
  player1Time: number
  player2Time: number
  scoreRatio: number
  isGameRunning: boolean
  // Callbacks to update parent state
  onPlayer1TimeChange: (newSeconds: number) => void
  onPlayer2TimeChange: (newSeconds: number) => void
  onScoreRatioChange: (newRatio: number) => void
  onStartGame: () => void
  onPauseGame: () => void
  onResetGame: () => void
  // Other display props
  player1Name?: string
  player2Name?: string
  player1Icon?: React.ElementType
  player2Icon?: React.ElementType
  player1Color?: "red" | "yellow"
  player2Color?: "red" | "yellow"
}

export function GameBoardLayout({
  children,
  boardProps = {},
  player1Time,
  player2Time,
  scoreRatio,
  isGameRunning,
  onStartGame,
  onPauseGame,
  onResetGame,
  player1Name = "OPPONENT",
  player2Name = "MYSELF",
  player1Icon = User2,
  player2Icon = User2,
  player1Color = "yellow",
  player2Color = "red",
}: GameBoardLayoutProps) {
  const defaultBoardProps = {
    interactive: true,
    animate_init: false,
    ariaLabel: "Connect 4 game board",
    ...boardProps,
  }

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
          onStartGame: onStartGame,
          onPauseGame: onPauseGame,
          onResetGame: onResetGame,
          player1Time: player1Time,
          player2Time: player2Time,
          scoreRatio: scoreRatio,
          isGameRunning: isGameRunning,
        })
      }
      return child
    })
  }, [children, onStartGame, onPauseGame, onResetGame, player1Time, player2Time, scoreRatio, isGameRunning])

  // Refs for the containers
  const desktopContainerRef = React.useRef<HTMLDivElement>(null)
  const mobileContainerRef = React.useRef<HTMLDivElement>(null)
  const childrenContainerRef = React.useRef<HTMLDivElement>(null)

  // Check viewport size and update state
  React.useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1280) // xl breakpoint is 1280px
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
          {/* Desktop Layout (xl breakpoint and above) */}
          <div className="hidden xl:flex xl:items-start xl:gap-8 min-h-[90vh]">
            {/* Left Section: Score Bar + Board Area - Fixed width based on viewport */}
            <div className="flex items-start">
              {/* Score Bar */}
              <div className="flex flex-col items-center justify-center px-4">
                <ScoreBar scoreRatio={scoreRatio} className="w-6 h-[90vh]" />
              </div>
              
              {/* Board Section - Fixed aspect ratio */}
              <div className="flex flex-col justify-between py-8 ml-4" style={{ width: 'min(70vh, 60vw)', height: '90vh' }}>
                {/* Player 1 Info and Timer (Top) */}
                <div className="flex justify-between items-center w-full mb-4 flex-shrink-0">
                  <PlayerInfo name={player1Name} icon={player1Icon} playerColor={player1Color} />
                  <Timer
                    secondsLeft={player1Time}
                    isRunning={isGameRunning}
                    color={player1Color}
                  />
                </div>

                {/* Board - Perfect square, constrained by available height */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <div className="aspect-square h-full max-w-full">
                    <Board {...defaultBoardProps} className="w-full h-full" />
                  </div>
                </div>

                {/* Player 2 Info and Timer (Bottom) */}
                <div className="flex justify-between items-center w-full mt-4 flex-shrink-0">
                  <PlayerInfo name={player2Name} icon={player2Icon} playerColor={player2Color} />
                  <Timer
                    secondsLeft={player2Time}
                    isRunning={isGameRunning}
                    color={player2Color}
                  />
                </div>
              </div>
            </div>

            {/* Right Section: Side Component - Takes remaining space */}
            <div className="flex-1 min-w-0">
              <motion.div
                className="bg-brand-secondary rounded-3xl p-8 xl:p-10 shadow-2xl border border-brand-border/40 select-none flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                ref={desktopContainerRef}
              >
              </motion.div>
            </div>
          </div>

          {/* Mobile/Tablet Layout (xl:hidden) */}
          <div className="xl:hidden w-full flex flex-col items-center">
            {/* Game Area */}
            <div className="flex-[3] flex min-h-0 w-full max-w-4xl">
              {/* Score Bar */}
              <div className="flex flex-col items-center justify-center px-2">
                <ScoreBar scoreRatio={scoreRatio} className="w-4 h-[calc(75vh-8rem)]" />
              </div>

              {/* Board + Player Info */}
              <div className="flex-1 flex flex-col justify-between py-4 px-2 min-w-0">
                <div className="flex justify-between items-center w-full flex-shrink-0">
                  <PlayerInfo name={player1Name} icon={player1Icon} playerColor={player1Color} />
                  <Timer
                    secondsLeft={player1Time}
                    isRunning={isGameRunning}
                    color={player1Color}
                  />
                </div>

                <div className="flex-1 flex items-center justify-center w-full py-2 min-h-0">
                  <div className="aspect-square w-full max-h-full">
                    <Board {...defaultBoardProps} className="w-full h-full" />
                  </div>
                </div>

                <div className="flex justify-between items-center w-full flex-shrink-0">
                  <PlayerInfo name={player2Name} icon={player2Icon} playerColor={player2Color} />
                  <Timer
                    secondsLeft={player2Time}
                    isRunning={isGameRunning}
                    color={player2Color}
                  />
                </div>
              </div>
            </div>

            {/* Side Component - Mobile */}
            <div className="flex-shrink-0 px-4 pb-4 w-full max-w-4xl">
              <motion.div
                className="bg-brand-secondary rounded-3xl p-6 xl:p-8 shadow-2xl border border-brand-border/40 select-none flex flex-col mx-auto"
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
}