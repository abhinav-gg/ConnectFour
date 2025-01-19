'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Home, LogIn, RotateCcw } from 'lucide-react';
import { GameState, type Player, type Move } from '@shared/utils/game';
import { eventEmitter } from '@shared/utils/eventEmitter'

interface GameBoardProps {
  playerNumber: number | null;
  isConnected: boolean;
  playersCount: number;
  roomId: string;
  onMove: (col: number) => void;
  ref: GameState | null;
}

export default function GameBoard (props: GameBoardProps)  {
  const [fallingPiece, setFallingPiece] = useState<{ row: number, col: number, player: Player } | null>(null)
  const [highlightedColumn, setHighlightedColumn] = useState<number | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gameState = props.ref
  const websocketMove = props.onMove

  useEffect(() => {

    const handleBoardUpdate = (data: { row: number; col: number; player: Player }) => {
      const { row, col, player } = data;
      setFallingPiece({ row: -1, col, player: gameState.currentPlayer })
      animatePieceFall(row, col)
    };

    const handleBoardSet = () => {
      console.log('Board set', gameState.getBoard());
      setUpdateCount(prev => prev + 1);
    }

    eventEmitter.on('boardUpdated', handleBoardUpdate);
    eventEmitter.on('boardSet', handleBoardSet);

    // Cleanup subscriptions on component unmount
    return (() => {
      eventEmitter.off('boardUpdated', handleBoardUpdate);
      eventEmitter.off('boardSet', handleBoardSet);
    });
  });

  useEffect(() => {
    if (props.isConnected && gameState.getMoves().length > 0) {
      const newGameState = new GameState()
      
      gameState.getMoves().forEach(({ player, col }, index) => {
        if (index === gameState.getMoves().length - 1) {
          setFallingPiece({ row: -1, col, player: player as Player })
          animatePieceFall(2, col)
        } else {
          newGameState.makeMove(col)
        }
      })

      // Update game state
      Object.assign(gameState, newGameState)
    }
  }, [props.isConnected])

  // const dropPiece = (col: number) => {

  //   if (gameState.gameOver || fallingPiece) return

  //   if (audioRef.current) {
  //     audioRef.current.play()
  //   }

  //   gameState.makeMove(col)
  // }

  const animatePieceFall = (targetRow: number, col: number) => {
    let currentRow = -1

    console.log('Animating piece fall', targetRow, col)
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
    console.log('Hovering column', col, gameState.currentPlayer, props.playerNumber, gameState.gameOver, fallingPiece, gameState.currentMoveIndex)
    if (gameState.currentPlayer != props.playerNumber 
      || gameState.gameOver || fallingPiece
      || gameState.currentMoveIndex != gameState.getMoves().length - 1
    ) {
      setHighlightedColumn(null)
      return
    }
    if (!gameState.gameOver && !fallingPiece && gameState.currentMoveIndex === gameState.getMoves().length - 1) {
      setHighlightedColumn(col)
    }
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
  }

  const playAgain = () => {
    window.location.reload()
  }

  const playDropSound = () => {
    try {
      const audio = new Audio('/drop-sound.mp3')
      audio.volume = 0.5
      audio.play()
    }
    catch (error) {
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Chevron indicators */}
            <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
              {Array(7).fill(null).map((_, colIndex) => (
                <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
                  {highlightedColumn === colIndex && !gameState.gameOver && !fallingPiece && 
                   gameState.currentMoveIndex === gameState.getMoves().length - 1 && (
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
                      onClick={() => {
                        handleColumnHover(colIndex)
                        if (highlightedColumn !== null) {
                          websocketMove(highlightedColumn);
                        }
                      }}
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
                                ? (cell === 0 ? 'bg-red-500' : 'bg-yellow-400')
                                : (fallingPiece?.player === 0 ? 'bg-red-500' : 'bg-yellow-400')
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
    </div>
  )
}
