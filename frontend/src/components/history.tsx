'use client';

import { ArrowLeft } from 'lucide-react';
import { GameState, ROWS, COLS } from '@/utils/game';
import { useEffect } from 'react';

interface MoveHistoryProps {
  gameState: GameState;
}

export default function MoveHistory({
  gameState,
}: MoveHistoryProps) {
  // Debug logging
  //console.log("Current Game State:", gameState);
  //console.log("Moves:", gameState.moves);
  //console.log("Current Move Index:", currentMoveIndex);

  const handleReturnToPresent = () => {
    if (gameState.moves.length > 0) {
      returnToPresent(); // Call the passed function to return to the present
    }
  };
  const goToMove = (index: number) => {
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
    for (let i = 0; i <= index; i++) {
      const move = gameState.moves[i]
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!newBoard[row][move.col]) {
          newBoard[row][move.col] = move.player
          break
        }
      }
    }
    gameState.board = newBoard
    gameState.currentPlayer = (index + 1) % 2 === 0 ? 2 : 1
  }

  const returnToPresent = () => {
    goToMove(gameState.moves.length - 1)
  }


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
          break
        case 'ArrowRight':
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState.moves])

  return (
    <div className="w-80 bg-white p-4 flex flex-col shadow-md overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Move History</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {gameState?.moves?.map((move, index) => (
          <button
            key={index}
            onClick={() => goToMove(index)}
            className={`w-8 h-8 rounded-full text-white font-bold ${
              move.player === 1 ? 'bg-red-500' : 'bg-yellow-400'
            } ${
              index === (gameState.moves.length) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            {move.col + 1}
          </button>
        )) || <p>No moves available.</p>}
      </div>
      {gameState?.moves?.length > 0 && (
        <button
          onClick={handleReturnToPresent}
          className="mt-4 mb-6 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
        >
          <ArrowLeft className="mr-2" />
          Return to Present
        </button>
      )}
    </div>
  );
}