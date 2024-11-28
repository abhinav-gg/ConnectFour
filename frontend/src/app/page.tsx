'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import GameBoard from '@/game-board';
import { getConfig } from '@/config/env';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [roomId, setRoomId] = useState('');
  const [moves, setMoves] = useState<Array<{ player: number; column: number; row: number }>>([]);

  useEffect(() => {
    const newSocket = io(getConfig().backendUrl);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('player_number', (number) => {
      setPlayerNumber(number);
    });

    newSocket.on('room_id', (id) => {
      setRoomId(id);
    });

    newSocket.on('game_status', (status) => {
      setGameStatus(status);
    });

    newSocket.on('players_count', (count) => {
      setPlayersCount(count);
    });

    newSocket.on('game_move', (moveData) => {
      setMoves(prev => [...prev, moveData]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleMove = (col: number) => {
    if (socket) {
      socket.emit('make_move', { column: col, roomId });
    }
  };

  return (
    <GameBoard 
      socket={socket}
      playerNumber={playerNumber}
      isConnected={isConnected}
      playersCount={playersCount}
      gameStatus={gameStatus}
      roomId={roomId}
      onMove={handleMove}
      moves={moves}
    />
  );
}