'use client';

import { ArrowLeft } from 'lucide-react';
import { GameState, ROWS, COLS } from '@/utils/game';
import { useEffect, useState } from 'react';
import { eventEmitter } from '@/utils/eventEmitter';
import { Player } from '@/utils/game';

interface MoveHistoryProps {
  ref: GameState;
}

export default function MoveHistory({
  ref,
}: MoveHistoryProps) {
  const gameState = ref;
  const [updateCount, setUpdateCount] = useState(0); 

  const handleBoardUpdate: (data: { row: number; col: number; player: Player }) => void = (data) => {
    // Update the state or perform actions based on the board update
    goToMove(gameState.getMoves().length - 1);
    setUpdateCount(prev => prev + 1);
  };

  eventEmitter.on('boardUpdated', handleBoardUpdate);

  const returnToPresent = () => {
    goToMove(gameState.getMoves().length - 1)
  }

  const goToMove = (index: number) => {

    console.log(index, gameState.currentMoveIndex, gameState.getMoves().length-1)
    if (index == gameState.currentMoveIndex) return;

    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    for (let i = 0; i <= index; i++) {
      const move = gameState.getMove(i);
      if (move) {
        const { player, col } = move;
        for (let row = ROWS - 1; row >= 0; row--) {
          if (!newBoard[row][col]) {
            newBoard[row][col] = player;
            break;
          }
        }
      }
    }
    gameState.setBoard(newBoard)
    gameState.currentPlayer = (index + 1) % 2 === 0 ? 2 : 1
    gameState.currentMoveIndex = index;
    setUpdateCount(prev => prev + 1);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log("Key pressed:", event.key);
      switch (event.key) {
        case 'ArrowUp':
          goToMove(0)
          break
        case 'ArrowDown':
          returnToPresent()
          break
        case 'ArrowLeft':
          if (gameState.currentMoveIndex > 0) {
            goToMove(gameState.currentMoveIndex - 1)
          }
          break
        case 'ArrowRight':
          if (gameState.currentMoveIndex < gameState.getMoves().length - 1) {
            goToMove(gameState.currentMoveIndex + 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState.getMoves()]);

  return (
    <div className="bg-white p-4 rounded-full shadow-lg flex flex-col items-center justify-center overflow-hidden">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Move History</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {gameState?.getMoves()?.map((move, index) => (
          <button
            key={index}
            onClick={() => goToMove(index)}
            className={`w-8 h-8 rounded-full text-white font-bold ${
              move.player === 1 ? 'bg-red-500' : 'bg-yellow-400'
            } ${
              index === (gameState.getMoves().length) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            {move.col + 1}
          </button>
        )) || <p>No moves available.</p>}
      </div>
      {gameState.currentMoveIndex < gameState.getMoves().length - 1 && (
        <button
          onClick={returnToPresent}
          className="mt-2 mb-4 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
        >
          <ArrowLeft className="mr-2" />
          Return to Present
        </button>
      )}
    </div>
  );
}