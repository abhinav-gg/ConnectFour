'use client';

import GameBoard from '@/components/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/history';
import { GameState, Player } from '@shared/utils/game';
import { JoinGame, MakeMove, Message, PlayerData, StartTimer } from '@shared/Types/websocketData';
import AuthPage from '@/components/checkAuth';
//import { useBeforeunload } from 'react-beforeunload';

type GamePlayer = {
  username: string;
  elo: number;
  time: number;
}

export default function TestingWebsockets() {
  const [roomId, setRoomId] = useState('');
  const [socket, setSocket] = useState<WebSocket>();
  const [getPlayers, setPlayers] = useState<GamePlayer[]>([]);
  const [playerNumber, setPlayerNumber] = useState<Player>(0);
  const [currentNumber, setCurrentNumber] = useState<Player>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const [gameStarted, setGameStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const gameBoardRef = useRef<GameState>();
  const timerInterval = useRef<NodeJS.Timeout>();
  gameBoardRef.current = new GameState();

  // FOR NOW ASSUME USER IS LOGGED IN
  // THIS WILL BE MERGED WITH /TEST-LOGIN SO THAT USER CAN LOGIN AS ANONYMOUS AS WELL

  const addPlayer = async (username: string, time: number) => {
    // Get the player data using api here
    const elo = 1000;

    getPlayers.push({ username, elo, time: 0 });
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  const changeCurrentPlayer = (nextPlayer: number, timeLeft: number) => {
    getPlayers[playerNumber].time = timeLeft;
    if (nextPlayer !== 0 && nextPlayer !== 1)
      throw new Error("Player Out Of Bounds")
    setCurrentNumber(nextPlayer); // countdown updated in its own interval
  }

  const notLoggedIn = () => {
    console.error('User not logged in!');
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (!roomFromUrl) {
      window.location.href = '/game/test-join';
      return;
    } else {
      window.location.href = '/game/test-join?room=' + roomFromUrl;
    }
  }

  const connectedUser = () => {
    
    const backendUrl = getConfig().websocketUrl;
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (!roomFromUrl) {
      window.location.href = '/game/test-join';
      return;
    }
    
    setRoomId(roomFromUrl);

    // Pass the token as a protocol
    const token = localStorage.getItem('token')!
    console.log('Connecting to:', backendUrl, token);
    const newSocket = new WebSocket(backendUrl, [token]);
    setSocket(newSocket);
    console.log("set socket", socket, newSocket);
    newSocket.onopen = () => {
      console.log('WebSocket connected!');
      setIsConnected(true);
      
      console.log('Auto-joining room:', roomFromUrl);
      newSocket.send(JSON.stringify({ 
        event: 'joinGame', 
        data: { roomId: roomFromUrl } 
        } as JoinGame));

      console.log("sent join game data");
    };

    newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data) as Message;
        console.log('Received message:', data);

        switch (data.event) {
        case 'playerJoined':
          if (data.data.playersCount === 1) {
            setGameStatus('Waiting for opponent...');
          } else if (data.data.playersCount === 2) {
            setGameStatus('Game ready to start! Waiting for player 1 to move...');
          }
          break;
        case 'gameStart':

          // parse players and add them to the list
          const players = data.data.players;
          setPlayerNumber(data.data.playerNumber as Player);
          players.forEach((player) => {
            addPlayer(player.username, player.time)
          });
          break;
        case 'startTimer': // SAME EXACT THING AS START GAME
          setGameStarted(true);
          break;
        case 'error':
          console.log('Error:', data.data.message);
          if (data.data.redirect)
            window.location.href = data.data.redirect;
          break;
        case 'roomFull':
          setGameStatus('Spectating game between players...');
          break;
        
        case 'moveMade':
          const gameState = gameBoardRef.current;
          if (gameState) {
            const index = gameState.getMoves().length-1;
            gameState.currentPlayer = data.data.nextPlayer as Player;
            gameState.currentMoveIndex = index;
            gameState.constructFromMoves();
            gameState.makeMove( 
              data.data.col,
            );
            changeCurrentPlayer(data.data.nextPlayer, data.data.timeLeft);
            setWaiting(false);
          } else {
            throw new Error('Game state is not initialized!');
          }
          break;
        case 'playerDisconnected':
          setGameStatus('Opponent disconnected. Waiting for reconnect or timeout...');
          break;
      }
    }
  }

  useEffect(() => {
    return () => {
      console.log('Closing WebSocket connection...');
      socket?.close();
    };
  }, []);

    // Add timer effect
  useEffect(() => {

    if (!gameStarted) return;

    timerInterval.current = setInterval(() => {

      // add 10 to the time of the current player
      getPlayers[playerNumber].time += 10;
      setTimeUpdate(timeUpdate + 1);

    }, 10);
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [gameStarted, getPlayers, playerNumber]);
  
  window.onbeforeunload = function() {
    socket?.close();
  };
    
  const handleMove = (col: number) => {

    if (waiting) return
    
    setWaiting(true);
    const currentGameBoard = gameBoardRef.current;
    console.log('Making move:', col, playerNumber, currentNumber);
    if (!currentGameBoard) return; // Ensure gameBoardRef.current is not undefined

    console.log('Game Over:', currentGameBoard.gameOver);
    if (currentGameBoard.gameOver || !(playerNumber == currentNumber)) {
      console.log("Don't accept moves")
    }

    console.log(socket, socket?.readyState);
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("SENT MOVE");
      socket.send(JSON.stringify(
        { event: 'makeMove', data: { roomId, col } } as MakeMove
      ));
    }

  };

  const BOARD = <GameBoard
  playerNumber={playerNumber}
  isConnected={isConnected}
  playersCount={2}
  roomId={roomId}
  onMove={handleMove}
  ref={gameBoardRef.current}
/>;
  const HISTORY = <MoveHistory ref={gameBoardRef.current} />;
  const BOARD_WITH_TIMERS = (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-2">
        <div className={`text-2xl font-mono ${playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          Player 1
        </div>
        <div className={`font-mono ${playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          <span className="text-2xl">{
            getPlayers.length > 1 ? formatTime(getPlayers[0].time).slice(0, -3) : '00:00'
          }</span>
          <span className="text-lg">{
            getPlayers.length > 1 ? formatTime(getPlayers[0].time).slice(-3) : ':00'
          }</span>
        </div>
      </div>
      {BOARD}
      <div className="flex justify-between items-center w-full mt-2">
        <div className={`text-2xl font-mono ${!playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          Player 2
        </div>
        <div className={`font-mono ${!playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          <span className="text-2xl">{
            getPlayers.length > 1 ? formatTime(getPlayers[1].time).slice(0, -3) : '00:00'
          }</span>
          <span className="text-lg">{
            getPlayers.length > 1 ? formatTime(getPlayers[1].time).slice(-3) : ':00'
          }</span>
        </div>
      </div>
    </div>
  );
  return (
  <AuthPage
    onAuthSuccess={ connectedUser }
    onAuthFail={ notLoggedIn }>
    <div className="flex min-h-screen bg-gray-100">
      <Dashboard />
      <div className="flex-1 flex flex-col">
        <div className="flex w-full">
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-xl font-semibold">Room: {roomId}</h2>
            <p className="text-gray-600">{gameStatus}</p>
            <p className="text-blue-600">You are Player {playerNumber}</p>
            { BOARD_WITH_TIMERS }
          </div>
          <div className="w-1/3 flex flex-col items-center justify-center">
            <div className="p-4 w-full">
              { HISTORY }
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthPage>
  );
}
