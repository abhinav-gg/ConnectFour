"use client"

import { useState } from "react"
import { GameBoardLayout } from "@/components/layouts/game-board-layout"
import { LiveGameSelection } from "@/components/game/LiveGameSelector"

export default function LiveGamePage() {
  // State for game board layout, managed here
  const [player1Time, setPlayer1Time] = useState(300000) // 5 minutes in milliseconds
  const [player2Time, setPlayer2Time] = useState(300000) // 5 minutes in milliseconds
  const [scoreRatio, setScoreRatio] = useState(0.5)
  const [isGameRunning, setIsGameRunning] = useState(false) // Game starts paused

  // Handlers for game state changes
  const handleStartGame = () => setIsGameRunning(true)
  const handlePauseGame = () => setIsGameRunning(false)
  const handleResetGame = () => {
    setPlayer1Time(300000)
    setPlayer2Time(300000)
    setScoreRatio(0.5)
    setIsGameRunning(false)
  }

  return (
    <GameBoardLayout
      player1Name="Player 1"
      player2Name="Player 2"
      player1Color="yellow"
      player2Color="red"
      player1Time={player1Time}
      player2Time={player2Time}
      scoreRatio={scoreRatio}
      isGameRunning={isGameRunning}
      onStartGame={handleStartGame}
      onPauseGame={handlePauseGame}
      onResetGame={handleResetGame}
      displayScoreBar={false} // Hide score bar on setup page
    >
      {/* LiveGameSelection is the child component */}
      <LiveGameSelection />
    </GameBoardLayout>
  )
}

