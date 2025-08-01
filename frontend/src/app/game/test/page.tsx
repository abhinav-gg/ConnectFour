"use client"

import { useState } from "react"
import { GameBoardLayout } from "../../../components/layouts/game-board-layout"
import { TestControls } from "./test-sidecomponent"
import { GameEndModal, GameResult, GameEndReason } from "../../../components/game/game-end-popup"

export default function GameTestPage() {
  const [player1Time, setPlayer1Time] = useState(90)
  const [player2Time, setPlayer2Time] = useState(90)
  const [scoreRatio, setScoreRatio] = useState(0.5) // 0.5 means equal
  const [isGameRunning, setIsGameRunning] = useState(false)
  
  // Game End Popup State
  const [showEndPopup, setShowEndPopup] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult>("win")
  const [gameReason, setGameReason] = useState<GameEndReason>("checkmate")
  const [playerName, setPlayerName] = useState("Test Player")
  const [playerRating, setPlayerRating] = useState(1515)
  const [ratingChange, setRatingChange] = useState(15)
  const [mistakes, setMistakes] = useState(1)
  const [blunders, setBlunders] = useState(0)
  const [greatMoves, setGreatMoves] = useState(3)

  const handleStartGame = () => setIsGameRunning(true)
  const handlePauseGame = () => setIsGameRunning(false)
  const handleResetGame = () => {
    setPlayer1Time(90)
    setPlayer2Time(90)
    setScoreRatio(0.5)
    setIsGameRunning(false)
  }

  const handleShowEndPopup = () => setShowEndPopup(true)
  const handleCloseEndPopup = () => setShowEndPopup(false)
  const handleReviewGame = () => console.log("Review game clicked")
  const handleNewGame = () => console.log("New game clicked")
  const handleRematch = () => console.log("Rematch clicked")

  return (
    <>
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
          onScoreRatioChange={setScoreRatio}
          onStartGame={handleStartGame}
          onPauseGame={handlePauseGame}
          onResetGame={handleResetGame}
          // Game End Popup Props
          showEndPopup={showEndPopup}
          onShowEndPopup={handleShowEndPopup}
          gameResult={gameResult}
          onGameResultChange={setGameResult}
          gameReason={gameReason}
          onGameReasonChange={setGameReason}
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          playerRating={playerRating}
          onPlayerRatingChange={setPlayerRating}
          ratingChange={ratingChange}
          onRatingChangeChange={setRatingChange}
          mistakes={mistakes}
          onMistakesChange={setMistakes}
          blunders={blunders}
          onBlundersChange={setBlunders}
          greatMoves={greatMoves}
          onGreatMovesChange={setGreatMoves}
        />
      </GameBoardLayout>
      
      <GameEndModal
        isOpen={showEndPopup}
        onClose={handleCloseEndPopup}
        result={gameResult}
        reason={gameReason}
        playerName={playerName}
        playerRating={playerRating}
        ratingChange={ratingChange}
        mistakes={mistakes}
        blunders={blunders}
        greatMoves={greatMoves}
        onReviewGame={handleReviewGame}
        onNewGame={handleNewGame}
        onRematch={handleRematch}
      />
    </>
  )
}
