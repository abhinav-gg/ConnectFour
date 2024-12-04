'use client';

import { ArrowLeft } from 'lucide-react';
import { GameState } from '@/utils/game';

interface MoveHistoryProps {
  gameState: GameState;
  currentMoveIndex: number;
  goToMove: (index: number) => void;
  returnToPresent: () => void;
}

export default function MoveHistory({
  gameState,
  currentMoveIndex,
  goToMove,
  returnToPresent
}: MoveHistoryProps) {
  return (
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
    </div>
  );
}