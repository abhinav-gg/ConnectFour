'use client';

import GameBoard from '@/components/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/history';
import GameAnalysis from '@/components/analysis';
import { GameState, Player } from '@/utils/game';
import { Analysis } from '@/utils/analysis';
// load from shared files

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

    if (new URLSearchParams(window.location.search).get('room') === null) {
      window.location.search = `/test-join`;
    }

    newSocket.onopen = () => {
        console.log('WebSocket connected!');
        setIsConnected(true);
        
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get('room') || '';
        console.log('Joining room:', roomFromUrl);
        setHasJoined(true);
        setRoomId(roomFromUrl);
        newSocket.send(JSON.stringify({ 
            event: 'joinGame', 
            data: { roomId: roomFromUrl, userId: userIdRef.current } 
        }));
      
    };

    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Message;
      console.log('Received message:', data);

      switch (data.event) {

        case 'playerTimedOut': /////////////////////////////////////////////////////

            // handle player timeout here.
            // if it was the other player, display win
            // if it was the current player, display loss

            break;

        case 'playerJoined': /////////////////////////////////////////////////////

            // if there is only player display the waiting stuff
            // if there are two players, display the game ready to start message
            // allow the first player to make the first move and start their clock
            setPlayersCount(data.data.player2 === null ? 1 : 2);
            if (playersCount) {
            setGameStatus('Waiting for opponent...');
            } else if (data.data.playersCount === 2) {
            setGameStatus('Game ready to start!');
            }
            break;

        case 'roomFull': /////////////////////////////////////////////////////

          // setup spectating mode here
          // ensure that this player is not one of the players of the game

          setGameStatus('Room is full. Spectating mode coming soon though!!');
          break;

        case 'playerDisconnected': /////////////////////////////////////////////////////
          
            // the remaining client should display a countdown to the game ending
            // after their timer, the game should end and the room should be deleted
            
            setPlayersCount(data.data.playersCount);
            setGameStatus('Opponent disconnected. Waiting...');
            break;

        case 'moveMade': /////////////////////////////////////////////////////

            // check which player has made the move and update the game board
            // change which clock counts down on the UI
            
            const gameState = gameBoardRef.current;
            if (gameState) {
                const index = gameState.getMoves().length-1;
                gameState.currentPlayer = index % 2 === 0 ? 2 : 1;
                gameState.currentMoveIndex = index;
                gameState.constructFromMoves();
                gameState.makeMove( 
                data.data.col, 
                );
                if (statusTextRef.current) {
                console.log (gameState.currentPlayer, playerNumber);
                statusTextRef.current.textContent = (gameState.currentPlayer === playerNumber ? 'Your' : "Opponent's") + '  turn...';
                }
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
      </div>
    </div>
  );
}
