'use client';

import GameBoard from '@/components/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/history';
import GameAnalysis from '@/components/analysis';
import { GameState, Player } from '@/utils/game';
import { Analysis } from '@/utils/analysis';
import { propagateServerField } from 'next/dist/server/lib/render-server';

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
  const statusTextRef = useRef<HTMLParagraphElement>(null);
  const gameBoardRef = useRef<GameState>();
  gameBoardRef.current = new GameState();

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
        setRoomId(roomFromUrl);
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
          const gameState = gameBoardRef.current;
          if (gameState) {
              const index = gameState.getMoves().length-1;
              gameState.currentPlayer = index % 2 === 0 ? 2 : 1;
              gameState.currentMoveIndex = index;
              gameState.constructFromMoves();
              gameState.makeMove( 
                data.data.col, 
              );
              // There is no way to store this as of right now
              // if (statusTextRef.current) {
              //   console.log (gameState.currentPlayer, playerNumber);
              //   statusTextRef.current.textContent = (gameState.currentPlayer === playerNumber ? 'Your' : "Opponent's") + '  turn...';
              // }
          }
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
    const currentGameBoard = gameBoardRef.current;
    if (!currentGameBoard) return; // Ensure gameBoardRef.current is not undefined

    if (currentGameBoard.gameOver || currentGameBoard.currentMoveIndex !== currentGameBoard.getMoves().length - 1) {
      console.log("Error")
    }

    if (socket && playerNumber && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: 'makeMove', data: { roomId, col } }));
    }

  };

  const inputRef = useRef<HTMLInputElement>(null);
  const BOARD = <GameBoard
  playerNumber={playerNumber}
  isConnected={isConnected}
  playersCount={playersCount}
  roomId={roomId}
  onMove={handleMove}
  ref={gameBoardRef.current}
/>;
  const HISTORY = <MoveHistory ref={gameBoardRef.current} />;
  const ANALYSIS = <GameAnalysis analysis={new Analysis(gameBoardRef.current)} />;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col">
        {!hasJoined ? (
          <div className="flex items-center justify-center w-full h-1/2">
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
        <div className="flex w-full">
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-xl font-semibold">Room: {roomId}</h2>
            <p className="text-gray-600">{gameStatus}</p>
            {playerNumber && (
              <p className="text-blue-600">You are Player {playerNumber}</p>
            )}
            { BOARD }
          </div>
          <div className="w-1/3 flex flex-col items-center justify-center">
            <div className="p-4 w-full">
              { HISTORY }
            </div><br/><br/>
            <div className="p-4 w-full">
              { ANALYSIS }
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
