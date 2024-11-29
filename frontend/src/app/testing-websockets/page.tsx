'use client';

import GameBoard from '@/game-board';
import { useEffect, useRef, useState } from 'react';

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
    const backendUrl = "ws://localhost:3001/ws"; // getConfig().backendUrl;
    const newSocket = new WebSocket(backendUrl);
    const userId = localStorage.getItem('userId') || crypto.randomUUID();
    localStorage.setItem('userId', userId);


    newSocket.onopen = () => {
      console.log('WebSocket connected!');
      setIsConnected(true);
    };

    setSocket(newSocket);

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
          setPlayerNumber(userId === data.data.firstPlayer ? 1 : 2);
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
  }, []);

  const handleJoinRoom = () => {
    const currentRoomId = inputRef.current?.value || '';
    console.log('Joining room:', currentRoomId);
    setRoomId(currentRoomId);

    console.log(currentRoomId.trim(), isConnected, socket);
    if (currentRoomId.trim() && isConnected && socket) {
      setHasJoined(true);
      const userId = localStorage.getItem('userId');

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ event: 'joinGame', data: { roomId: currentRoomId, userId } }));
      }
    }
  };

  const handleMove = (col: number) => {
    if (socket && playerNumber && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: 'makeMove', data: { roomId, col } }));
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {!hasJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md w-96">
            <h1 className="text-2xl font-bold mb-6 text-center">Join Game Room</h1>
            <div className="space-y-4">
              <input
                type="text"
                ref={inputRef}
                defaultValue={roomId}
                placeholder="Enter Room ID"
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
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

          {gameStatus === 'Game Over' && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
            >
              New Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}
