'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import GameBoard from '@/game-board';
import { io, Socket } from 'socket.io-client';

type Move = { player: 1 | 2; col: number };

export default function Page() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isPlayer1, setIsPlayer1] = useState<boolean>(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [moves, setMoves] = useState<Move[]>([]);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    setSocket(socketInstance);
    socketInstance.emit('joinGame', 'default-room');

    socketInstance.on('playerAssigned', (playerNumber: 1 | 2) => {
      setIsPlayer1(playerNumber === 1);
    });

    socketInstance.on('moveMade', (move: Move) => {
      setMoves(prevMoves => [...prevMoves, move]);
      setCurrentPlayer(move.player === 1 ? 2 : 1);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleMove = (move: Move) => {
    if (!socket || (isPlayer1 && currentPlayer !== 1) || (!isPlayer1 && currentPlayer !== 2)) {
      return;
    }

    socket.emit('makeMove', {
      gameId: 'default-room',
      move: {
        player: currentPlayer,
        col: move.col
      }
    });

    setMoves(prevMoves => [...prevMoves, move]);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="transform scale-125">
          <GameBoard
            onMove={handleMove}
            readOnly={(isPlayer1 && currentPlayer !== 1) || (!isPlayer1 && currentPlayer !== 2)}
            initialMoves={moves}
            currentMoveIndex={moves.length - 1}
          />
        </div>
      </div>
    </Suspense>
  );
}