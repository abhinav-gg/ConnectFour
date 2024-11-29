'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

type Player = 1 | 2
type Cell = Player | null
type Move = { player: Player; col: number }

const ROWS = 6
const COLS = 7

interface GameBoardProps {
  onMove?: (move: Move) => void
  readOnly?: boolean
  initialMoves?: Move[]
  currentMoveIndex?: number
}

export default function GameBoard({ 
  onMove, 
  readOnly = false, 
  initialMoves = [], 
  currentMoveIndex = -1 
}: GameBoardProps) {
  const [board, setBoard] = useState<Cell[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
  const [winner, setWinner] = useState<Player | null>(null)
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
  const [fallingPiece, setFallingPiece] = useState<{ row: number, col: number, player: Player } | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/drop-sound.mp3')
  }, [])

  const dropPiece = (col: number) => {
    if (readOnly || winner || fallingPiece || gameOver) return

    if (audioRef.current) {
      audioRef.current.play()
    }

    const newBoard = [...board]
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        setFallingPiece({ row: -1, col, player: currentPlayer })
        animatePieceFall(row, col)
        if (onMove) {
          onMove({ player: currentPlayer, col })
        }
        break
      }
    }
  }

  const animatePieceFall = (targetRow: number, col: number) => {
    let currentRow = -1
    const fallInterval = setInterval(() => {
      if (currentRow < targetRow) {
        currentRow++
        setFallingPiece(prev => ({ ...prev!, row: currentRow }))
      } else {
        clearInterval(fallInterval)
        setFallingPiece(null)
        const newBoard = [...board]
        newBoard[targetRow][col] = currentPlayer
        setBoard(newBoard)
        checkWinner(targetRow, col)
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
      }
    }, 100)
  }

  const checkWinner = (row: number, col: number) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]

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

    if (board.every(row => row.every(cell => cell !== null))) {
      setGameOver(true)
    }
  }

  const handleColumnHover = (col: number) => {
    if (!readOnly && !gameOver && !fallingPiece) {
      setHighlightedColumn(col)
    }
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
  }

  return (
    <div className="relative">
      {/* Chevron indicators */}
      <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
        {Array(COLS).fill(null).map((_, colIndex) => (
          <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
            {highlightedColumn === colIndex && !gameOver && !fallingPiece && !readOnly && (
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
          {board.map((row, rowIndex) => (
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
  )
}