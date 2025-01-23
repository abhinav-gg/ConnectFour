'use client';

import { GamePlayer } from '@shared/Models/gameInfo';
import React from 'react';

interface EndPopupProps {
  playerNumber: number;
  result: { winner: number, deltaElo: number };
  players: GamePlayer[];
  onRematch: () => void;
  onClose: () => void;
}

const EndPopup: React.FC<EndPopupProps> = ({ playerNumber, result, players, onRematch, onClose }) => {
  const { winner, deltaElo } = result;
  const draw = winner === -1;
  const positiveDelta = deltaElo >= 0;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg z-50">
        <h2 className="text-xl font-bold text-center mb-4">
          {(winner !== -1) ? `Winner: ${players[winner]}` : 'Draw'}
        </h2>
        <div>
          <p className="text-center">
            <span className={positiveDelta ? 'text-green-500' : deltaElo === 0 ? 'text-black' : 'text-red-500'}>
              {players[playerNumber].username} - Elo: {players[playerNumber].elo + deltaElo} ({deltaElo >= 0 ? `+${deltaElo}` : deltaElo})
            </span>
          </p>
        </div>
        <div className="mt-4 flex justify-around">
          <button onClick={onRematch} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Rematch
          </button>
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndPopup;
