'use client';

import { getConfig } from '@/config/env';
import GameBoard from '@/game-board';
import { useEffect, useState } from 'react';

type PlayerJoined = {
  event: 'playerJoined';
  data: { playersCount: number; };
};

type RoomFull = {
  event: 'roomFull';
};

type GameStart = {
  event: 'gameStart';
  data: { firstPlayer: string; };
};

type PlayerDisconnected = {
  event: 'playerDisconnected';
  data: { playersCount: number; };
};

type MoveMade = {
  event: 'moveMade';
  data: { player: number; col: number; row: number; };
};

type Message = PlayerJoined | RoomFull | GameStart | PlayerDisconnected | MoveMade;

export default function TestingWebsockets() {
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const [moves, setMoves] = useState<Array<{ player: number; column: number; row: number; }>>([]);

  useEffect(() => {
    const backendUrl = getConfig().backendUrl;
    const newSocket = new WebSocket(backendUrl);
    const userID = localStorage.getItem('userID') || crypto.randomUUID();

    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log('WebSocket connected!');
      setIsConnected(true);
      if (hasJoined) {
        newSocket.send(JSON.stringify({ event: 'joinGame', data: { roomId, userID } }));
      }
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Message;
      console.log(data);
      switch (data.event) {
        case 'playerJoined':
          setPlayersCount(data.data.playersCount);
          if (data.data.playersCount === 1) {
            setGameStatus('Waiting for opponent...');
          } else if (data.data.playersCount === 2) {
            setGameStatus('Game ready to start!');
          }
          break;
        case 'roomFull':
          setGameStatus('Room is full. Please try another room.');
          break;
        case 'gameStart':
          setPlayerNumber(userID === data.data.firstPlayer ? 1 : 2);
          setGameStatus('Game started!');
          break;
        case 'playerDisconnected':
          setPlayersCount(data.data.playersCount);
          setGameStatus('Opponent disconnected. Waiting for new player...');
          break;
        case 'moveMade':
          setMoves(prev => [...prev, { player: data.data.player, column: data.data.col, row: data.data.row }]);
          break;
      }
    };

    return () => {
      newSocket.close();
    };
  }, [roomId, hasJoined]);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setHasJoined(true);
      socket?.send(JSON.stringify({ event: 'joinGame', data: { roomId } }));
    }
  };

  const handleMove = (col: number) => {
    if (socket && playerNumber) {
      socket.send(JSON.stringify({ event: 'makeMove', data: { roomId, col } }));
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
