'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Home, LogIn, RotateCcw } from 'lucide-react';
import { GameState } from '@shared/utils/game';
import { eventEmitter } from '@shared/utils/eventEmitter'
import { Player } from '@shared/types/game';

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
      setFallingPiece({ row: -1, col, player: gameState!.currentPlayer })
      animatePieceFall(row, col)
    };

    const handleBoardSet = () => {
      // console.log('Board set', gameState!.getBoard());
      setUpdateCount(prev => prev + 1);
    }

    eventEmitter.sub('boardUpdated', handleBoardUpdate);
    eventEmitter.sub('boardSet', handleBoardSet);

    // Cleanup subscriptions on component unmount
    return (() => {
      eventEmitter.unsub('boardUpdated', handleBoardUpdate);
      eventEmitter.unsub('boardSet', handleBoardSet);
    });
  });

  useEffect(() => {
    if (props.isConnected && gameState!.getMoves().length > 0) {
      const newGameState = new GameState()
      
      gameState!.getMoves().forEach(({ player, col }, index) => {
        if (index === gameState!.getMoves().length - 1) {
          setFallingPiece({ row: -1, col, player: player as Player })
          animatePieceFall(2, col)
        } else {
          newGameState.makeMove(col)
        }
      })

      // Update game state
      Object.assign(gameState!, newGameState)
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

    //console.log('Animating piece fall', targetRow, col)
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
    if (gameState!.currentPlayer != props.playerNumber 
      || gameState!.gameOver || fallingPiece
      || gameState!.currentMoveIndex != gameState!.getMoves().length - 1
    ) {
      setHighlightedColumn(null)
      return
    }
    setHighlightedColumn(col)
  }

  const handleColumnClick = (col: number) => {
    if (gameState!.currentPlayer != props.playerNumber 
      || gameState!.gameOver || fallingPiece
      || gameState!.currentMoveIndex != gameState!.getMoves().length - 1
    ) {
      return
    }
    websocketMove(col);
  }

  const handleColumnLeave = () => {
    setHighlightedColumn(null)
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
    <div className="flex-col flex items-center justify-center w-full">
      <div className="w-full max-w-[600px]">
        <div className="relative w-full aspect-square">
          {/* Chevron indicators */}
          <div className="absolute top-[-24px] left-0 right-0 flex justify-around">
            {Array(7).fill(null).map((_, colIndex) => (
              <div key={`chevron-${colIndex}`} className="w-12 flex justify-center">
                {highlightedColumn === colIndex && !gameState!.gameOver && !fallingPiece && 
                 gameState!.currentMoveIndex === gameState!.getMoves().length - 1 && (
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
                    onClick={() => handleColumnClick(colIndex)}
                    onTouchStart={() => handleColumnHover(colIndex)}
                    onTouchEnd={() => handleColumnLeave()}
                    onMouseEnter={() => handleColumnHover(colIndex)}
                    onMouseLeave={handleColumnLeave}
                  />
                ))}
              </div>

              {/* Game grid */}
              <div className="grid grid-cols-7 gap-1">
                {gameState!.getBoard().map((row, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <div
                        key={colIndex}
                        className="aspect-square w-full bg-blue-300 border-2 border-blue-600 rounded-full flex items-center justify-center overflow-hidden"
                      >
                        {(cell !== null || (fallingPiece && fallingPiece.col === colIndex && rowIndex <= fallingPiece.row)) && (
                          <div
                            className={`w-3/4 h-3/4 rounded-full ${
                              cell !== null 
                                ? (cell === 0 ? 'bg-red-500' : 'bg-yellow-400')
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
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
