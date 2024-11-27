'use client'

import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import Link from 'next/link'
import { Home, LogIn, RotateCcw, FileText, ChevronDown, ArrowLeft } from 'lucide-react'

type Player = 1 | 2
type Cell = Player | null
type Move = { player: Player; col: number }

const ROWS = 6
const COLS = 7

interface GameBoardProps {
  socket: Socket | null;
  playerNumber: number | null;
  isConnected: boolean;
  playersCount: number;
  gameStatus: string;
  roomId: string;
  onMove: (col: number) => void;
  moves: Array<{ player: number; column: number; row: number }>;
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
  const [board, setBoard] = useState<Cell[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
  const [winner, setWinner] = useState<Player | null>(null)
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
  const [fallingPiece, setFallingPiece] = useState<{ row: number, col: number, player: Player } | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [moves, setMoves] = useState<Move[]>([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('/drop-sound.mp3')
  }, [])

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
          if (currentMoveIndex < moves.length - 1) {
            goToMove(currentMoveIndex + 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentMoveIndex, moves])

  const checkWinner = (row: number, col: number, currentBoard: Cell[][]) => {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal right
      [1, -1], // diagonal left
    ];

    const currentPlayerValue = currentBoard[row][col];

    for (const [dx, dy] of directions) {
      let count = 1;
      // Check in both directions
      for (const factor of [-1, 1]) {
        let r = row + factor * dx;
        let c = col + factor * dy;
        
        while (
          r >= 0 && r < ROWS && 
          c >= 0 && c < COLS && 
          currentBoard[r][c] === currentPlayerValue
        ) {
          count++;
          r += factor * dx;
          c += factor * dy;
        }
      }
      
      if (count >= 4) {
        setWinner(currentPlayerValue);
        setGameOver(true);
        return true;
      }
    }

    // Check for draw
    if (currentBoard.every(row => row.every(cell => cell !== null))) {
      setGameOver(true);
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (isConnected && externalMoves?.length > 0) {
      const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
      
      externalMoves.forEach(({ player, column, row }) => {
        const col = typeof column === 'number' ? column : parseInt(column);
        let targetRow = ROWS - 1;
        while (targetRow >= 0 && newBoard[targetRow][col] !== null) {
          targetRow--;
        }
        
        if (targetRow >= 0) {
          newBoard[targetRow][col] = player as Player;
          checkWinner(targetRow, col, newBoard);
        }
      });
      
      setBoard(newBoard);
      setCurrentPlayer(externalMoves.length % 2 === 0 ? 1 : 2);
    }
  }, [isConnected, externalMoves]);

  const dropPiece = (col: number) => {
    if (winner || fallingPiece || gameOver || currentPlayer !== playerNumber) return;
    
    // Find the lowest empty row in the selected column
    let targetRow = ROWS - 1;
    while (targetRow >= 0 && board[targetRow][col] !== null) {
      targetRow--;
    }
    
    if (targetRow >= 0) {
      setFallingPiece({ row: -1, col, player: currentPlayer });
      animatePieceFall(targetRow, col);
      onMove(col);
    }
  };

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
        checkWinner(targetRow, col, newBoard)
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
      }
    }, 100)
  }

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setCurrentPlayer(1)
    setWinner(null)
    setFallingPiece(null)
    setGameOver(false)
    setMoves([])
    setCurrentMoveIndex(-1)
  }

  const handleColumnHover = (col: number) => {
    if (!gameOver && !fallingPiece && currentMoveIndex === moves.length - 1) {
      setHighlightedColumn(col)
    }
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
  }

  const goToMove = (index: number) => {
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    for (let i = 0; i <= index; i++) {
      const move = moves[i]
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!newBoard[row][move.col]) {
          newBoard[row][move.col] = move.player
          break
        }
      }
    }
    setBoard(newBoard)
    // debug
    console.log(`current index: ${index}`);
    console.log(`setting player to ${(index + 1) % 2 === 0 ? 2 : 1}`);
    setCurrentPlayer((index + 1) % 2 === 0 ? 2 : 1)
    setCurrentMoveIndex(index)
  }

  const returnToPresent = () => {
    goToMove(moves.length - 1)
  }

  const playAgain = () => {
    window.location.reload();
  };

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
              {Array(COLS).fill(null).map((_, colIndex) => (
                <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
                  {highlightedColumn === colIndex && !gameOver && !fallingPiece && currentMoveIndex === moves.length - 1 && (
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
                            className={`w-10 h-10 rounded-full ${cell !== null
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
      <div className="w-64 bg-white p-4 flex flex-col shadow-md overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Move History</h2>
        <div className="flex flex-wrap gap-2">
          {moves.map((move, index) => (
            <button
              key={index}
              onClick={() => goToMove(index)}
              className={`w-8 h-8 rounded-full text-white font-bold ${move.player === 1 ? 'bg-red-500' : 'bg-yellow-400'
                } ${index === currentMoveIndex ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
            >
              {move.col + 1}
            </button>
          ))}
        </div>
        {currentMoveIndex !== moves.length - 1 && (
          <button
            onClick={returnToPresent}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
          >
            <ArrowLeft className="mr-2" />
            Return to Present
          </button>
        )}
      </div>
    </div>
  )
}