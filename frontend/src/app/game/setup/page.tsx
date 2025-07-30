"use client"

import { useState, useEffect } from "react"
import { GameBoardLayout } from "@/components/game-board-layout"
import { LiveGameSelection } from "@/components/game/live-game-selection"

export default function LiveGamePage() {
  // State for game board layout, managed here
  const [player1Time, setPlayer1Time] = useState(90)
  const [player2Time, setPlayer2Time] = useState(90)
  const [scoreRatio, setScoreRatio] = useState(0.5)
  const [isGameRunning, setIsGameRunning] = useState(false) // Example: game starts paused

  // Example handlers for game state changes
  const handleStartGame = () => setIsGameRunning(true)
  const handlePauseGame = () => setIsGameRunning(false)
  const handleResetGame = () => {
    setPlayer1Time(90)
    setPlayer2Time(90)
    setScoreRatio(0.5)
    setIsGameRunning(false)
  }
  const handlePlayer1TimeChange = (newTime: number) => setPlayer1Time(newTime)
  const handlePlayer2TimeChange = (newTime: number) => setPlayer2Time(newTime)
  const handleScoreRatioChange = (newRatio: number) => setScoreRatio(newRatio)

  // Example: Simulate game start after component mounts
  useEffect(() => {
    // For demonstration, start timers after a delay
    const timer = setTimeout(() => {
      setIsGameRunning(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <GameBoardLayout
      player1Name="Player 1"
      player2Name="Player 2"
      player1Color="yellow"
      player2Color="red"
      // Pass state as prop
      player1Time={player1Time}
      player2Time={player2Time}
      scoreRatio={scoreRatio}
      isGameRunning={isGameRunning}
      // Pass handlers to GameBoardLayout
      onPlayer1TimeChange={handlePlayer1TimeChange}
      onPlayer2TimeChange={handlePlayer2TimeChange}
      onScoreRatioChange={handleScoreRatioChange}
      onStartGame={handleStartGame}
      onPauseGame={handlePauseGame}
      onResetGame={handleResetGame}
    >
      {/* LiveGameSelection is the child component */}
      <LiveGameSelection />
    </GameBoardLayout>
  )
}
