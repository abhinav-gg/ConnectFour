'use client';

import GameBoard from '@/components/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/history';
import Analysis from '@/components/analysis';
import { GameState, type Player } from '@/utils/game';

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
  const userIdRef = useRef(crypto.randomUUID());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [gameState] = useState(() => new GameState());
  const [analysisData, setAnalysisData] = useState({
    evaluation: 0,
    explanation: "Game is currently even",
    alternativeMoves: []
  });

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
          setMoves(prev => [...prev, { 
            player: data.data.player, 
            column: data.data.col, 
            row: data.data.row 
          }]);
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

  const goToMove = (index: number) => {
    const newBoard = gameState.getBoardAtMove(index);
    Object.assign(gameState.board, newBoard);
    gameState.currentPlayer = (index + 1) % 2 === 0 ? 2 : 1;
    setCurrentMoveIndex(index);
  };

  const returnToPresent = () => {
    goToMove(gameState.moves.length - 1);
  };

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
              onMove={handleMove}
              moves={moves}
            />
            <MoveHistory
              gameState={gameState}
              currentMoveIndex={currentMoveIndex}
              goToMove={goToMove}
              returnToPresent={returnToPresent}
            />
            <Analysis
              currentPlayer={gameState.currentPlayer}
              evaluation={analysisData.evaluation}
              explanation={analysisData.explanation}
              alternativeMoves={analysisData.alternativeMoves}
            />
          </div>
        )}
      </div>
    </div>
  );
}
