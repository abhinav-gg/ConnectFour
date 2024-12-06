'use client';

import GameBoard from '@/components/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/history';
import GameAnalysis from '@/components/analysis';
import { GameState, Player } from '@/utils/game';
import { Analysis } from '@/utils/analysis';

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
  data: { player: Player; col: number; };
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
  const userIdRef = useRef(crypto.randomUUID());
  let gameBoardRef = useRef<GameState>();
  gameBoardRef.current = new GameState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    
    if (roomFromUrl) {
      console.log('Found room in URL:', roomFromUrl);
      setRoomId(roomFromUrl);
      if (inputRef.current) {
        inputRef.current.value = roomFromUrl;
      }
    }
  }, []); 

  useEffect(() => {
    const backendUrl = getConfig().websocketUrl;
    const newSocket = new WebSocket(backendUrl);
    console.log('Connection established with userId:', userIdRef.current);

    newSocket.onopen = () => {
      console.log('WebSocket connected!');
      setIsConnected(true);
      
      const params = new URLSearchParams(window.location.search);
      const roomFromUrl = params.get('room');
      if (roomFromUrl) {
        console.log('Auto-joining room:', roomFromUrl);
        setHasJoined(true);
        newSocket.send(JSON.stringify({ 
          event: 'joinGame', 
          data: { roomId: roomFromUrl, userId: userIdRef.current } 
        }));
      }
    };

    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Message;
      console.log('Received message:', data);

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
          console.log('Game Start - comparing IDs:', {
            firstPlayer: data.data.firstPlayer,
            myUserId: userIdRef.current,
            willBe: data.data.firstPlayer === userIdRef.current ? 'Player 1' : 'Player 2'
          });
          setPlayerNumber(data.data.firstPlayer === userIdRef.current ? 1 : 2);
          setGameStatus('Game started!');
          break;
        case 'playerDisconnected':
          setPlayersCount(data.data.playersCount);
          setGameStatus('Opponent disconnected. Waiting for new player...');
          break;
        case 'moveMade':
          gameBoardRef.current?.addMove({ 
            player: data.data.player, 
            col: data.data.col, 
          });
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
    
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoomId);
    window.history.pushState({}, '', url);

    setRoomId(currentRoomId);

    if (currentRoomId.trim() && isConnected && socket) {
      setHasJoined(true);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          event: 'joinGame', 
          data: { roomId: currentRoomId, userId: userIdRef.current } 
        }));
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
    <div className="min-h-screen bg-gray-100 flex">
      <Dashboard />
      <div className="flex-1 p-4">
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
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold">Room: {roomId}</h2>
            <p className="text-gray-600">{gameStatus}</p>
            {playerNumber && (
              <p className="text-blue-600">You are Player {playerNumber}</p>
            )}
            <GameBoard
              socket={socket}
              playerNumber={playerNumber}
              isConnected={isConnected}
              playersCount={playersCount}
              gameStatus={gameStatus}
              roomId={roomId}
              ref={gameBoardRef.current}
            />
            <MoveHistory
              ref={gameBoardRef.current}
            />
            <GameAnalysis
              analysis={new Analysis(gameBoardRef.current)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
