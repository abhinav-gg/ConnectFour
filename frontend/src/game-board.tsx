/// <reference types="@types/react" />
'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Home, LogIn, RotateCcw, FileText, ChevronDown } from 'lucide-react'

type Player = 1 | 2
type Cell = Player | null

const ROWS = 6
const COLS = 7

export default function GameBoard() {
  const [board, setBoard] = useState<Cell[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
  const [winner, setWinner] = useState<Player | null>(null)
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
  const [fallingPiece, setFallingPiece] = useState<{ row: number, col: number, player: Player } | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!gameOver) {
      resetGame()
    }
  }, [gameOver])

  useEffect(() => {
    audioRef.current = new Audio('/drop-sound.mp3')
  }, [])

  const dropPiece = (col: number) => {
    if (winner || fallingPiece || gameOver) return

    const newBoard = [...board]
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        setFallingPiece({ row: -1, col, player: currentPlayer })
        animatePieceFall(row, col)
        break
      }
    }
  }

  const animatePieceFall = (targetRow: number, col: number) => {
    let currentRow = -1
    const fallInterval = setInterval(() => {
      if (currentRow < targetRow) {
        currentRow++
        setFallingPiece((prev: { row: number, col: number, player: Player } | null) => ({ ...prev!, row: currentRow }))
      } else {
        clearInterval(fallInterval)
        setFallingPiece(null)
        const newBoard = [...board]
        newBoard[targetRow][col] = currentPlayer
        setBoard(newBoard)
        if (audioRef.current) {
          audioRef.current.play()
        }
        checkWinner(targetRow, col)
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
      }
    }, 100)
  }

  const checkWinner = (row: number, col: number) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ]

    for (const [dx, dy] of directions) {
      let count = 1
      for (const factor of [-1, 1]) {
        let r = row + factor * dx
        let c = col + factor * dy
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === currentPlayer) {
          count++
          r += factor * dx
          c += factor * dy
        }
      }
      if (count >= 4) {
        setWinner(currentPlayer)
        setGameOver(true)
        return
      }
    }

    if (board.every((row: any[]) => row.every((cell: null) => cell !== null))) {
      setGameOver(true)
    }
  }

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setCurrentPlayer(1)
    setWinner(null)
    setFallingPiece(null)
    setGameOver(false)
  }

  const handleColumnHover = (col: number) => {
    if (!gameOver && !fallingPiece) {
      setHighlightedColumn(col)
    }
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
  }

  return (
    <div className="min-h-screen bg-blue-100 flex">
      {/* Dashboard */}
      <div className="w-64 bg-blue-200 p-4 flex flex-col">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Dashboard</h2>
        <Link href="/" className="flex items-center text-blue-800 hover:text-blue-600 mb-2">
          <Home className="mr-2" />
          Home
        </Link>
        <Link href="/login" className="flex items-center text-blue-800 hover:text-blue-600">
          <LogIn className="mr-2" />
          Login
        </Link>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-blue-800 mb-8">Connect Four</h1>
        <div className="relative">
          {/* Chevron indicators */}
          <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
            {Array(COLS).fill(null).map((_, colIndex) => (
              <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
                {highlightedColumn === colIndex && !gameOver && !fallingPiece && (
                  <ChevronDown className="text-orange-500 animate-bounce" />
                )}
              </div>
            ))}
          </div>

          {/* Game board with invisible input areas */}
          <div className="bg-blue-300 p-4 rounded-lg shadow-lg">
            <div className="relative">
              {/* Invisible input areas */}
              <div className="absolute top-0 left-0 right-0 bottom-0 flex">
                {Array(COLS).fill(null).map((_, colIndex) => (
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
              {board.map((row: any[], rowIndex: number) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell: number | null, colIndex: any) => (
                    <div
                      key={colIndex}
                      className="w-12 h-12 bg-blue-200 border border-blue-400 rounded-full m-1 flex items-center justify-center overflow-hidden"
                    >
                      {(cell !== null || (fallingPiece && fallingPiece.col === colIndex)) && (
                        <div
                          className={`w-10 h-10 rounded-full ${
                            (cell === 1 || (fallingPiece && fallingPiece.player === 1)) ? 'bg-red-500' : 'bg-yellow-400'
                          } transition-transform duration-100`}
                          style={{
                            transform: fallingPiece && fallingPiece.col === colIndex
                              ? `translateY(${(fallingPiece.row - rowIndex) * 100}%)`
                              : 'none'
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

        {gameOver && (
          <div className="mt-4 text-center">
            {winner ? (
              <div className="text-2xl font-bold text-orange-500 mb-4">
                Player {winner} wins!
              </div>
            ) : (
              <div className="text-2xl font-bold text-orange-500 mb-4">
                It's a draw!
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setGameOver(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
              >
                <RotateCcw className="mr-2" />
                New Game
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
              >
                <FileText className="mr-2" />
                Review Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}