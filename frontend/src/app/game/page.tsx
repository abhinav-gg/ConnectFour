'use client';

import GameBoard from '@/components/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/history';
import { GameState, Player } from '@shared/utils/game';
import { Message } from '@shared/Types/websocketData';

export default function TestingWebsockets() {
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const statusTextRef = useRef<HTMLParagraphElement>(null);
  const gameBoardRef = useRef<GameState>();
  gameBoardRef.current = new GameState();

  // FOR NOW ASSUME USER IS LOGGED IN
  // THIS WILL BE MERGED WITH /TEST-LOGIN SO THAT USER CAN LOGIN AS ANONYMOUS AS WELL

  useEffect(() => {

    const backendUrl = getConfig().websocketUrl;
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      console.error('No access token found!');
      window.location.href = '/game/test-login';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (!roomFromUrl) {
      console.error('No room ID found in URL!');
      window.location.href = '/game/test-login';
      return;
    }

    // Pass the token as a protocol
    const newSocket = new WebSocket(backendUrl, [accessToken]);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected!');
      setIsConnected(true);
      
      console.log('Auto-joining room:', roomFromUrl);
      setHasJoined(true);
      setRoomId(roomFromUrl);
      newSocket.send(JSON.stringify({ 
        event: 'joinGame', 
        data: { roomId: roomFromUrl } 
        }));
    };

    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Message;
      console.log('Received message:', data);

      /*switch (data.event) {
        case 'playerJoined':
          setPlayersCount(data.data.playersCount);
          if (data.data.playersCount === 1) {
            setGameStatus('Waiting for opponent...');
          } else if (data.data.playersCount === 2) {
            setGameStatus('Game ready to start!');
          }
          break;
        case 'roomFull':
          setGameStatus('Spectating game between players...');
          break;
        case 'gameStart':
          console.log('Game Start - comparing IDs:', {
            firstPlayer: data.data.player1,
            myUserId: userIdRef.current,
            willBe: data.data.player1 === userIdRef.current ? 'Player 1' : 'Player 2'
          });
          setPlayerNumber(data.data.player1 === userIdRef.current ? 1 : 2);
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
      }*/
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
          data: { roomId: currentRoomId } 
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
