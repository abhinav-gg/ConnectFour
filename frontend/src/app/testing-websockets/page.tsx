'use client';

import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { config } from '@/config/env';
import GameBoard from '@/game-board';

export default function TestingWebsockets() {
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const [moves, setMoves] = useState<Array<{ player: number; column: number; row: number; }>>([]);

  useEffect(() => {
    const newSocket = io(config.backendUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Client Socket.IO connected!');
      setIsConnected(true);
      if (hasJoined) {
        newSocket.emit('joinGame', roomId);
      }
    });

    newSocket.on('playerJoined', ({ playersCount, playerNumber }) => {
      setPlayersCount(playersCount);
      if (playersCount === 1) {
        setGameStatus('Waiting for opponent...');
      } else if (playersCount === 2) {
        setGameStatus('Game ready to start!');
      }
    });

    newSocket.on('roomFull', ({ message }) => {
      setGameStatus('Room is full. Please try another room.');
    });

    newSocket.on('gameStart', ({ firstPlayer }) => {
      setPlayerNumber(newSocket.id === firstPlayer ? 1 : 2);
      setGameStatus('Game started!');
    });

    newSocket.on('playerDisconnected', ({ playersCount }) => {
      setPlayersCount(playersCount);
      setGameStatus('Opponent disconnected. Waiting for new player...');
    });

    newSocket.on('moveMade', ({ col, player, row }) => {
      setMoves(prev => [...prev, { player, column: col, row }]);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, hasJoined]);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setHasJoined(true);
      socket?.emit('joinGame', roomId);
    }
  };

  const handleMove = (col: number) => {
    if (socket && playerNumber) {
      socket.emit('makeMove', { roomId, col });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!hasJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md w-96">
            <h1 className="text-2xl font-bold mb-6 text-center">Join Game Room</h1>
            <div className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleJoinRoom}
                className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold">Room: {roomId}</h2>
            <p className="text-gray-600">{gameStatus}</p>
            {playerNumber && (
              <p className="text-blue-600">You are Player {playerNumber}</p>
            )}
          </div>
          
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
        </div>
      )}
    </div>
  );
}
