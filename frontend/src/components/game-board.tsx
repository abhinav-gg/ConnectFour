'use client';

import { ArrowLeft, ChevronDown, Home, LogIn, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { GameState, type Player, generateAnalysis } from '@/utils/game';
import Analysis from '@/components/analysis';

interface GameBoardProps {
  socket: WebSocket | null;
  playerNumber: number | null;
  isConnected: boolean;
  playersCount: number;
  gameStatus: string;
  roomId: string;
  onMove: (col: number) => void;
  moves: Array<{ player: number; column: number; row: number; }>;
}

export default function GameBoard({
  socket,
  playerNumber,
  isConnected,
  playersCount,
  gameStatus,
  roomId,
  onMove,
  moves: externalMoves = []
}: GameBoardProps) {
  const [gameState] = useState(() => new GameState())
  const [fallingPiece, setFallingPiece] = useState<{ row: number, col: number, player: Player } | null>(null)
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const audioRef = useRef<HTMLAudioElement[]>([])
  const [analysisData, setAnalysisData] = useState({
    evaluation: 0,
    explanation: "Game is currently even",
    alternativeMoves: []
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          goToMove(0)
          break
        case 'ArrowDown':
          returnToPresent()
          break
        case 'ArrowLeft':
          if (currentMoveIndex > 0) {
            goToMove(currentMoveIndex - 1)
          }
          break
        case 'ArrowRight':
          if (currentMoveIndex < gameState.moves.length - 1) {
            goToMove(currentMoveIndex + 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentMoveIndex, gameState.moves])

  useEffect(() => {
    if (isConnected && externalMoves?.length > 0) {
      const newGameState = new GameState()
      
      externalMoves.forEach(({ player, column, row }, index) => {
        const col = typeof column === 'number' ? column : parseInt(column)
        if (index === externalMoves.length - 1) {
          setFallingPiece({ row: -1, col, player: player as Player })
          animatePieceFall(row, col)
        } else {
          newGameState.makeMove(col)
        }
      })

      // Update game state
      Object.assign(gameState, newGameState)
    }
  }, [isConnected, externalMoves])

  const dropPiece = (col: number) => {
    if (gameState.winner || fallingPiece || gameState.gameOver || 
        currentMoveIndex !== gameState.moves.length - 1 || 
        gameState.currentPlayer !== playerNumber) return

    const targetRow = gameState.getAvailableRow(col)
    if (targetRow >= 0) {
      setFallingPiece({ row: -1, col, player: gameState.currentPlayer })
      animatePieceFall(targetRow, col)
      onMove(col)
    }
  }

  const animatePieceFall = (targetRow: number, col: number) => {
    playDropSound()
    let currentRow = -1
    const fallInterval = setInterval(() => {
      if (currentRow < targetRow) {
        currentRow++
        setFallingPiece(prev => ({ ...prev!, row: currentRow }))
      } else {
        clearInterval(fallInterval)
        setFallingPiece(null)
        gameState.makeMove(col)
        setCurrentMoveIndex(gameState.moves.length - 1)
        //setAnalysisData(generateAnalysis(gameState.board, gameState.currentPlayer))
      }
    }, 100)
  }

  const handleColumnHover = (col: number) => {
    if (!gameState.gameOver && !fallingPiece && currentMoveIndex === gameState.moves.length - 1) {
      setHighlightedColumn(col)
    }
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
  }

  const goToMove = (index: number) => {
    const newBoard = gameState.getBoardAtMove(index)
    Object.assign(gameState.board, newBoard)
    gameState.currentPlayer = (index + 1) % 2 === 0 ? 2 : 1
    setCurrentMoveIndex(index)
  }

  const returnToPresent = () => {
    goToMove(gameState.moves.length - 1)
  }

  const playAgain = () => {
    window.location.reload()
  }

  const playDropSound = () => {
    try {
      const audio = new Audio('/drop-sound.mp3')
      audio.volume = 0.5
      audio.play().catch(error => {
        console.log('Audio playback failed:', error)
      })
    } catch (error) {
      console.log('Audio creation failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Dashboard */}
      <div className="w-64 bg-white p-4 flex flex-col shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-2">
          <Home className="mr-2" />
          Home
        </Link>
        <Link href="/login" className="flex items-center text-gray-600 hover:text-gray-800">
          <LogIn className="mr-2" />
          Login
        </Link>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Connect Four with History</h1>
          <div className="relative">
            {/* Chevron indicators */}
            <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
              {Array(7).fill(null).map((_, colIndex) => (
                <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
                  {highlightedColumn === colIndex && !gameState.gameOver && !fallingPiece && 
                   currentMoveIndex === gameState.moves.length - 1 && (
                    <ChevronDown className="text-orange-500 animate-bounce" />
                  )}
                </div>
              ))}
            </div>

            {/* Game board with invisible input areas */}
            <div className="bg-blue-500 p-4 rounded-lg shadow-lg">
              <div className="relative">
                {/* Invisible input areas */}
                <div className="absolute top-0 left-0 right-0 bottom-0 flex">
                  {Array(7).fill(null).map((_, colIndex) => (
                    <div
                      key={`input-${colIndex}`}
                      className="flex-1 cursor-pointer"
                      onClick={() => dropPiece(colIndex)}
                      onMouseEnter={() => handleColumnHover(colIndex)}
                      onMouseLeave={handleColumnLeave}
                    />
                  ))}
                </div>

                {/* Game grid */}
                {gameState.board.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => (
                      <div
                        key={colIndex}
                        className="w-12 h-12 bg-blue-300 border-2 border-blue-600 rounded-full m-1 flex items-center justify-center overflow-hidden"
                      >
                        {(cell !== null || (fallingPiece && fallingPiece.col === colIndex && rowIndex <= fallingPiece.row)) && (
                          <div
                            className={`w-10 h-10 rounded-full ${
                              cell !== null 
                                ? (cell === 1 ? 'bg-red-500' : 'bg-yellow-400')
                                : (fallingPiece?.player === 1 ? 'bg-red-500' : 'bg-yellow-400')
                            } transition-transform duration-100`}
                            style={{
                              transform: fallingPiece && fallingPiece.col === colIndex && rowIndex <= fallingPiece.row
                                ? `translateY(${(fallingPiece.row - rowIndex) * 100}%)`
                                : 'none',
                              opacity: fallingPiece && fallingPiece.col === colIndex && rowIndex <= fallingPiece.row
                                ? Math.max(0, 1 - (fallingPiece.row - rowIndex) * 0.2)
                                : 1
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {gameState.gameOver && (
            <div className="mt-4 text-center">
              {gameState.winner ? (
                <div className="text-2xl font-bold text-orange-500 mb-4">
                  Player {gameState.winner} wins!
                </div>
              ) : (
                <div className="text-2xl font-bold text-orange-500 mb-4">
                  It's a draw!
                </div>
              )}
              <button
                onClick={playAgain}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <RotateCcw className="mr-2" />
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Move History Panel */}
      <div className="w-80 bg-white p-4 flex flex-col shadow-md overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Move History</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {gameState.moves.map((move, index) => (
            <button
              key={index}
              onClick={() => goToMove(index)}
              className={`w-8 h-8 rounded-full text-white font-bold ${
                move.player === 1 ? 'bg-red-500' : 'bg-yellow-400'
              } ${
                index === currentMoveIndex ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              {move.col + 1}
            </button>
          ))}
        </div>
        {currentMoveIndex !== gameState.moves.length - 1 && (
          <button
            onClick={returnToPresent}
            className="mt-4 mb-6 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
          >
            <ArrowLeft className="mr-2" />
            Return to Present
          </button>
        )}

        <Analysis
          currentPlayer={gameState.currentPlayer}
          evaluation={analysisData.evaluation}
          explanation={analysisData.explanation}
          alternativeMoves={analysisData.alternativeMoves}
        />
      </div>
    </div>
  )
}