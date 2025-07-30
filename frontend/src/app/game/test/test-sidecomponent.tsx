"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

interface TestControlsProps {
  player1Time: number
  player2Time: number
  scoreRatio: number
  isGameRunning: boolean
  onPlayer1TimeChange: (newTime: number) => void
  onPlayer2TimeChange: (newTime: number) => void
  onScoreRatioChange: (newRatio: number) => void
  onStartGame: () => void
  onPauseGame: () => void
  onResetGame: () => void
}

export function TestControls({
  player1Time,
  player2Time,
  scoreRatio,
  isGameRunning,
  onPlayer1TimeChange,
  onPlayer2TimeChange,
  onScoreRatioChange,
  onStartGame,
  onPauseGame,
  onResetGame,
}: TestControlsProps) {
  const [p1TimeInput, setP1TimeInput] = useState(player1Time.toString())
  const [p2TimeInput, setP2TimeInput] = useState(player2Time.toString())
  const [scoreRatioInput, setScoreRatioInput] = useState(scoreRatio.toFixed(2)) // Format for display

  // Sync internal state with props when props change
  useEffect(() => {
    setP1TimeInput(player1Time.toString())
  }, [player1Time])

  useEffect(() => {
    setP2TimeInput(player2Time.toString())
  }, [player2Time])

  useEffect(() => {
    setScoreRatioInput(scoreRatio.toFixed(2))
  }, [scoreRatio])
  

  const handleP1TimeChange = (value: string) => {
    setP1TimeInput(value)
    const num = Number.parseInt(value, 10)
    if (!isNaN(num)) {
      onPlayer1TimeChange(num)
    }
  }

  const handleP2TimeChange = (value: string) => {
    setP2TimeInput(value)
    const num = Number.parseInt(value, 10)
    if (!isNaN(num)) {
      onPlayer2TimeChange(num)
    }
  }

  const handleScoreRatioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setScoreRatioInput(value)
    const num = Number.parseFloat(value)
    console.log(`Input value: "${value}", Parsed num: ${num}, isNaN(num): ${isNaN(num)}`)

    if (typeof onScoreRatioChange === "function") {
      // Explicitly check if it's a function
      if (!isNaN(num) && num >= 0 && num <= 1) {
        onScoreRatioChange(num)
      } else if (value === "") {
        onScoreRatioChange(0)
      }
    } else {
      console.error("onScoreRatioChange is NOT a function or is undefined!", onScoreRatioChange) // Updated message
    }
  }

  return (
    <motion.div
      className="space-y-6 p-4 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-bold text-center">Game Controls</h2>

      {/* Timer Controls */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Timers</h3>
        <div className="flex gap-2">
          <Button onClick={onStartGame} disabled={isGameRunning} className="flex-1">
            Start Timers
          </Button>
          <Button onClick={onPauseGame} disabled={!isGameRunning} className="flex-1" variant="secondary">
            Pause Timers
          </Button>
        </div>
        <Button onClick={onResetGame} className="w-full bg-transparent" variant="outline">
          Reset Game State
        </Button>

        <div className="space-y-2">
          <Label htmlFor="p1-time">Player 1 Time (seconds)</Label>
          <Input
            id="p1-time"
            type="number"
            value={p1TimeInput}
            onChange={(e) => handleP1TimeChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p2-time">Player 2 Time (seconds)</Label>
          <Input
            id="p2-time"
            type="number"
            value={p2TimeInput}
            onChange={(e) => handleP2TimeChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Score Bar Control */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Score Bar</h3>
        <div className="space-y-2">
          <Label htmlFor="score-ratio-input">Score Ratio (0-1)</Label>
          <Input
            id="score-ratio-input"
            type="number"
            value={scoreRatioInput}
            onChange={handleScoreRatioInputChange}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>
      </div>

      {/* Current State Display */}
      <div className="space-y-2 text-sm text-brand-text-muted">
        <p>Current Player 1 Time: {player1Time}s</p>
        <p>Current Player 2 Time: {player2Time}s</p>
        <p>Current Score Ratio: {scoreRatio.toFixed(2)}</p>
        <p>Game Running: {isGameRunning ? "Yes" : "No"}</p>
      </div>
    </motion.div>
  )
}
