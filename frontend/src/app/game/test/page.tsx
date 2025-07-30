"use client"

import { useState } from "react"
import { GameBoardLayout } from "../../../components/game-board-layout"
import { TestControls } from "./test-sidecomponent"

export default function GameTestPage() {
  const [player1Time, setPlayer1Time] = useState(90)
  const [player2Time, setPlayer2Time] = useState(90)
  const [scoreRatio, setScoreRatio] = useState(0.5) // 0.5 means equal
  const [isGameRunning, setIsGameRunning] = useState(false)

  const handleStartGame = () => setIsGameRunning(true)
  const handlePauseGame = () => setIsGameRunning(false)
  const handleResetGame = () => {
    setPlayer1Time(90)
    setPlayer2Time(90)
    setScoreRatio(0.5)
    setIsGameRunning(false)
  }

  return (
    <GameBoardLayout
      player1Name="Test Player 1"
      player2Name="Test Player 2"
      player1Color="yellow"
      player2Color="red"
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
        interactive: true, // Make board interactive for testing
        animate_init: false,
        ariaLabel: "Connect 4 test board",
      }}
    >
      <TestControls
        player1Time={player1Time}
        player2Time={player2Time}
        scoreRatio={scoreRatio}
        isGameRunning={isGameRunning}
        onPlayer1TimeChange={setPlayer1Time}
        onPlayer2TimeChange={setPlayer2Time}
        onScoreRatioChange={setScoreRatio} // Pass directly here
        onStartGame={handleStartGame}
        onPauseGame={handlePauseGame}
        onResetGame={handleResetGame}
      />
    </GameBoardLayout>
  )
}
