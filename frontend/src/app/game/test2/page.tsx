"use client"

import { useState } from "react"
import { GameBoardLayout } from "@/components/game-board-layout"
import { LiveGameWithAnalysis } from "./comp"

export default function LiveGamePage() {
  const [player1Time, setPlayer1Time] = useState(300) // 5 minutes
  const [player2Time, setPlayer2Time] = useState(300) // 5 minutes
  const [scoreRatio, setScoreRatio] = useState(0.5)
  const [isGameRunning, setIsGameRunning] = useState(true) // Game is live

  const handleStartGame = () => setIsGameRunning(true)
  const handlePauseGame = () => setIsGameRunning(false)
  const handleResetGame = () => {
    setPlayer1Time(300)
    setPlayer2Time(300)
    setScoreRatio(0.5)
    setIsGameRunning(false)
  }

  const handleColumnAttempt = (col: number) => {
    console.log(`Player attempted move in column ${col}`)
    // Here you would handle the actual game logic
  }

  return (
    <GameBoardLayout
      player1Name="Opponent"
      player2Name="You"
      player1Color="red"
      player2Color="yellow"
      player1Time={player1Time}
      player2Time={player2Time}
      scoreRatio={scoreRatio}
      isGameRunning={isGameRunning}
      onPlayer1TimeChange={setPlayer1Time}
      onPlayer2TimeChange={setPlayer2Time}
      onScoreRatioChange={setScoreRatio}
      onStartGame={handleStartGame}
      onPauseGame={handlePauseGame}
      onResetGame={handleResetGame}
      boardProps={{
        interactive: true,
        animate_init: false,
        onColumnAttempt: handleColumnAttempt,
        ariaLabel: "Live Connect 4 game board",
      }}
    >
      <LiveGameWithAnalysis />
    </GameBoardLayout>
  )
}
