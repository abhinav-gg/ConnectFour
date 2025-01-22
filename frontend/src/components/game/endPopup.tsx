'use client';

import { GamePlayer } from '@shared/Models/gameInfo';
import React from 'react';

interface EndPopupProps {
  winner: string | null;
  players: GamePlayer[];
  deltaElo: number;
  onRematch: () => void;
  onClose: () => void;
}

const EndPopup: React.FC<EndPopupProps> = ({ winner, players, deltaElo, onRematch, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-center mb-4">
          {winner ? `Winner: ${winner}` : 'Draw'}
        </h2>
        <div>
          {players.map((player, index) => (
            <p key={index} className="text-center">
              {player.username} - Elo: {player.elo} ({deltaElo >= 0 ? `+${deltaElo}` : deltaElo})
            </p>
          ))}
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
