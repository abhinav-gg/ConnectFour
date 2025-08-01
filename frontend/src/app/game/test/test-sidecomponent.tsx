"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { GameResult, GameEndReason } from "@/components/game/game-end-popup"

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
  // Game End Popup Props
  showEndPopup: boolean
  onShowEndPopup: () => void
  gameResult: GameResult
  onGameResultChange: (result: GameResult) => void
  gameReason: GameEndReason
  onGameReasonChange: (reason: GameEndReason) => void
  playerName: string
  onPlayerNameChange: (name: string) => void
  playerRating: number
  onPlayerRatingChange: (rating: number) => void
  ratingChange: number
  onRatingChangeChange: (change: number) => void
  mistakes: number
  onMistakesChange: (mistakes: number) => void
  blunders: number
  onBlundersChange: (blunders: number) => void
  greatMoves: number
  onGreatMovesChange: (greatMoves: number) => void
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
  // Game End Popup Props
  showEndPopup,
  onShowEndPopup,
  gameResult,
  onGameResultChange,
  gameReason,
  onGameReasonChange,
  playerName,
  onPlayerNameChange,
  playerRating,
  onPlayerRatingChange,
  ratingChange,
  onRatingChangeChange,
  mistakes,
  onMistakesChange,
  blunders,
  onBlundersChange,
  greatMoves,
  onGreatMovesChange,
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

      {/* Game End Popup Controls */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Game End Popup</h3>
        
        <Button onClick={onShowEndPopup} className="w-full bg-purple-600 hover:bg-purple-700">
          Show Game End Popup
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="game-result">Game Result</Label>
            <div className="flex gap-1 mt-1">
              {(["win", "loss", "draw"] as GameResult[]).map((result) => (
                <Button
                  key={result}
                  size="sm"
                  variant={gameResult === result ? "default" : "outline"}
                  onClick={() => onGameResultChange(result)}
                  className="flex-1 text-xs"
                >
                  {result.charAt(0).toUpperCase() + result.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="game-reason">Game Reason</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {(["checkmate", "timeout", "resignation", "draw", "abandonment"] as GameEndReason[]).map((reason) => (
                <Button
                  key={reason}
                  size="sm"
                  variant={gameReason === reason ? "default" : "outline"}
                  onClick={() => onGameReasonChange(reason)}
                  className="text-xs px-2 py-1"
                >
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="player-name">Player Name</Label>
            <Input
              id="player-name"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="player-rating">Player Rating</Label>
            <Input
              id="player-rating"
              type="number"
              value={playerRating}
              onChange={(e) => onPlayerRatingChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rating-change">Rating Change</Label>
            <Input
              id="rating-change"
              type="number"
              value={ratingChange}
              onChange={(e) => onRatingChangeChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="mistakes">Mistakes</Label>
            <Input
              id="mistakes"
              type="number"
              min="0"
              value={mistakes}
              onChange={(e) => onMistakesChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="blunders">Blunders</Label>
            <Input
              id="blunders"
              type="number"
              min="0"
              value={blunders}
              onChange={(e) => onBlundersChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="great-moves">Great Moves</Label>
            <Input
              id="great-moves"
              type="number"
              min="0"
              value={greatMoves}
              onChange={(e) => onGreatMovesChange(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">How to Edit Props:</h4>
          <ul className="text-xs text-brand-text-muted space-y-1">
            <li>• <strong>Game Result:</strong> Click Win/Loss/Draw buttons to change the outcome</li>
            <li>• <strong>Win:</strong> Shows golden trophy + green up arrow (regardless of rating change)</li>
            <li>• <strong>Loss:</strong> Shows red X + red down arrow (regardless of rating change)</li>
            <li>• <strong>Draw:</strong> Shows blue award + grey up arrow (regardless of rating change)</li>
            <li>• <strong>Game Reason:</strong> Click reason buttons to change why the game ended</li>
            <li>• <strong>Player Info:</strong> Edit name and rating in the text fields</li>
            <li>• <strong>Rating Change:</strong> Use positive numbers for gains, negative for losses</li>
            <li>• <strong>Game Stats:</strong> Adjust mistakes, blunders, and great moves counts</li>
            <li>• <strong>Preview:</strong> Click "Show Game End Popup" to see your changes</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
