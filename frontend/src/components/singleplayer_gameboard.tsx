'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RotateCcw, FileText, ChevronDown } from 'lucide-react'
import { GameState, Player, Move } from '@/utils/game'
import { eventEmitter } from '@/utils/eventEmitter'

const ROWS = 6
const COLS = 7

// add Props interface with ref=GameState referene
interface SinglePlayerGameboardProps {
  ref: GameState;
}
export default function SinglePlayerGameboard(props: SinglePlayerGameboardProps) {
  const gameState = props.ref;
  const [updateCount, setUpdateCount] = useState(0);  
  const [fallingPiece, setFallingPiece] = useState<{ row: number; col: number; player: Player } | null>(null)
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)


  useEffect(() => {
    audioRef.current = new Audio('/drop-sound.mp3')
  }, [])

  useEffect(() => {
    const handleBoardUpdate = (data: { row: number; col: number; player: Player }) => {
      console.log('Board updated:', data);
      const { row, col, player } = data;
      setFallingPiece({ row: -1, col, player: gameState.currentPlayer })
      animatePieceFall(row, col)
      // You can also trigger animations or other UI updates here
    };

    const handleGameEnd = (winner: number | null) => {
      // Handle game end logic, e.g., show a message
      console.log('Game ended. Winner:', winner);
    };

    const handleBoardSet = () => {
      setUpdateCount(prev => prev + 1);
    };

    eventEmitter.on('boardUpdated', handleBoardUpdate);
    eventEmitter.on('gameEnded', handleGameEnd);
    eventEmitter.on('boardSet', handleBoardSet);

    // Cleanup subscriptions on component unmount
    return () => {
      eventEmitter.off('boardUpdated', handleBoardUpdate);
      eventEmitter.off('gameEnded', handleGameEnd);
      eventEmitter.off('boardSet', handleBoardSet);
    };
  }, []);

  const dropPiece = (col: number) => {

    if (gameState.gameOver || fallingPiece) return

    if (audioRef.current) {
      audioRef.current.play()
    }

    gameState.makeMove(col)
  }

  const animatePieceFall = (targetRow: number, col: number) => {
    let currentRow = -1
    const fall = () => {
      if (currentRow < targetRow) {
        currentRow++
        setFallingPiece(prev => ({ ...prev!, row: currentRow }))
        requestAnimationFrame(fall)
      } else {
        setFallingPiece(null)
      }
    };

    // Adjust the speed of the fall animation
    const fallSpeed = 10; 
    const fallInterval = 1000 / fallSpeed; // Adjust the interval

    const slowFall = () => {
      if (currentRow < targetRow) {
        currentRow++;
        setFallingPiece(prev => ({ ...prev!, row: currentRow }));
        setTimeout(slowFall, fallInterval); // Use setTimeout to control the speed
      } else {
        setFallingPiece(null);
      }
    };

    slowFall() // Start the slow fall animation
  }

  const handleColumnHover = (col: number) => {
    if (!gameState.gameOver && !fallingPiece 
      && (gameState.currentMoveIndex == gameState.getMoves().length - 1)
    ) {
      setHighlightedColumn(col)
    }
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 rounded-lg shadow-lg w-full">
        <div className="relative">
          {/* Chevron indicators */}
          <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
            {Array(COLS).fill(null).map((_, colIndex) => (
              <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
                {highlightedColumn === colIndex && !gameState.gameOver && !fallingPiece && (
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
              {gameState.getBoard().map((row, rowIndex) => (
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
                              : (fallingPiece?.player === 1 ? 'bg-yellow-500' : 'bg-red-400')
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
            <div className="flex gap-4">
              <button
                onClick={window.location.reload}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
              >
                <RotateCcw className="mr-2" />
                New Game
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
              >
                <FileText className="mr-2" />
                Analyse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}