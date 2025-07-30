'use client';

import { ArrowLeft } from 'lucide-react';
import { GameState } from '@shared/utils/Games/game';
import { ROWS, COLS } from '@shared/constants';
import { useEffect, useState } from 'react';
import { eventEmitter } from '@shared/utils/eventEmitter';

interface MoveHistoryProps {
  ref: GameState;
}

export default function MoveHistory({
  ref,
}: MoveHistoryProps) {
  const gameState = ref;
  const [updateCount, setUpdateCount] = useState(0); 

  const returnToPresent = () => {
    if (gameState.currentMoveIndex >= 0)
      goToMove(gameState.getMoves().length - 1)
  }

  const goToMove = (index: number) => {
    //console.log(index, gameState.currentMoveIndex, gameState.getMoves().length - 1)
    if (index == gameState.currentMoveIndex) return;
    gameState.currentPlayer = (index % 2 === 0) ? 1 : 0;
    gameState.currentMoveIndex = index;
    gameState.constructFromMoves();
    setUpdateCount(prev => prev + 1);
  }

  useEffect(() => {

    const handleBoardUpdate = () => {
      returnToPresent();
      setUpdateCount(prev => prev + 1);
    };
  
    eventEmitter.sub('boardUpdated', handleBoardUpdate);  

    const handleKeyDown = (event: KeyboardEvent) => {

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

      return (() => {
        eventEmitter.unsub('boardUpdated', handleBoardUpdate);  
      });

    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState.getMoves()]);

  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow-lg">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Move History</h2>
      <div className="flex flex-wrap gap-2 mb-2 md:mb-4 max-h-[150px] overflow-y-auto">
        {gameState?.getMoves()?.map((move, index) => (
          <button
            key={index}
            onClick={() => goToMove(index)}
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-white font-bold ${
              move.player === 0 ? 'bg-red-500' : 'bg-yellow-400'
            } ${
              index === (gameState.getMoves().length) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            {parseInt(move.col as any) + 1}
          </button>
        )) || <p>No moves available.</p>}
      </div>
      {gameState.currentMoveIndex < gameState.getMoves().length - 1 && (
        <button
          onClick={returnToPresent}
          className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-200"
        >
          <ArrowLeft className="mr-2" />
          Return to Present
        </button>
      )}
    </div>
  );
}