'use client';

import GameBoard from '@/components/game/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/game/history';
import { GameState, Player } from '@shared/utils/game';
import { JoinGame, MakeMove, ClientMessage, PlayerData, PlayerTimeOut, StartTimer } from '@shared/Types/websocketData';
import AuthPage from '@/components/checkAuth';
import Timer from '@/components/game/timer';
import { GamePlayer } from '@shared/Models/gameInfo';
import LiveChat from '@/components/game/chat';

export default function TestingWebsockets() {
  const [timeUpdate, setTimeUpdate] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [socket, setSocket] = useState<WebSocket>();
  const [playerNumber, setPlayerNumber] = useState<Player>(0);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const [gameStarted, setGameStarted] = useState(false);
  const [timeStarted, setTimeStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const gameBoardRef = useRef<GameState>();
  const [chatMessages, setChatMessages] = useState<{ playerNumber?: number; message: string }[]>([]);

  // FOR NOW ASSUME USER IS LOGGED IN
  // THIS WILL BE MERGED WITH /TEST-LOGIN SO THAT USER CAN LOGIN AS ANONYMOUS AS WELL

  const addPlayer = async (username: string, time: number) => {
    // Update to use setState
    const elo = 1000;
    setGamePlayers(prev => [...prev, { username, elo: elo, time, timerActive: false }]);
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

  const handleMoveReceived = (data: { nextPlayer: number; col: number; timeLeft: number }) => {
    const gameState = gameBoardRef.current;

    if (gameState) {
      const index = gameState.getMoves().length;
      gameState.currentMoveIndex = index - 1;
      gameState.constructFromMoves();
      gameState.currentPlayer = data.nextPlayer ? 0 : 1 as Player;
      gameState.makeMove(data.col);
      if (data.timeLeft > 0) {
        setGamePlayers(prev => {
          const newPlayers = [...prev];
          newPlayers[data.nextPlayer ? 0 : 1].time = data.timeLeft;
          return newPlayers;
        });
      }
      gameState.currentMoveIndex = index;
      gameState.currentPlayer = data.nextPlayer as Player;
      gameState.constructFromMoves();
      setWaiting(false);

    } 
    else {
      throw new Error('Game state is not initialized!');
    }
    // Update timer active state
    setGamePlayers(prev => {
      const newPlayers = [...prev];
      return newPlayers;
    });
    setCurrentPlayer(data.nextPlayer as Player);
    setTimeUpdate(timeUpdate + 1);
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

    };

    newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data) as ClientMessage;
        console.log('Received message:', data);

        switch (data.event) {
        case 'playerJoined':
          setGameStatus('Waiting for opponent...');
          break;
        case 'gameStart':
          // parse players and add them to the list
          const players = data.data.players;
          setPlayerNumber(data.data.playerNumber as Player);
          players.forEach((player) => {
            addPlayer(player.username, player.time)
          });
          if (data.data.playerNumber === 0) {
            setGameStatus('Game started! Your move!');
          } else {
            setGameStatus('Game started! Waiting for player 1 move...');
          }
          setGameStarted(true);
          setTimeUpdate(prevTimeUpdate => prevTimeUpdate + 1);
          break;
        case 'startTimer':
          setTimeUpdate(timeUpdate + 1);
          setTimeStarted(true);
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
          handleMoveReceived(data.data);
          setTimeUpdate(timeUpdate + 1);
          break;
        case 'playerDisconnected':
          setGameStatus('Opponent disconnected. Waiting for reconnect or timeout...');
          break;
        case 'chatMessage':
          setChatMessages(prev => [...prev, {
            playerNumber: data.data.playerNumber,
            username: gamePlayers[data.data.playerNumber].username,
            message: data.data.message
          }]);
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

  window.onbeforeunload = function() {
    socket?.close();
  };
    
  const handleMove = (col: number) => {

    if (!gameStarted) return;
    if (waiting) return
    
    setWaiting(true);
    const currentGameBoard = gameBoardRef.current;
    console.log('Making move:', col, playerNumber);
    if (!currentGameBoard) return; // Ensure gameBoardRef.current is not undefined

    if (currentGameBoard.gameOver || !(playerNumber == currentGameBoard.currentPlayer)) {
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

  const handleSendMessage = (inputMessage: string) => {
    
    if (!inputMessage.trim() || !socket) return;

    socket.send(JSON.stringify({
      event: 'chatMessage',
      data: { roomId, message: inputMessage }
    }));
  };

  useEffect(() => {
    if (!gameBoardRef.current) {
      gameBoardRef.current = new GameState();
    }
  }, []);

  const BOARD = <GameBoard
  playerNumber={playerNumber}
  isConnected={isConnected}
  playersCount={2}
  roomId={roomId}
  onMove={handleMove}
  ref={gameBoardRef.current!}
/>;
  const HISTORY = <MoveHistory ref={gameBoardRef.current!} />;
  const BOARD_WITH_TIMERS = (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-1">
        <div className={`text-2xl font-mono ${playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          Player 1
        </div>
        <div className={`font-mono ${playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          <Timer 
            timerActive={timeStarted && currentPlayer===0} 
            playerNumber={0} 
            getPlayers={gamePlayers} 
          />
        </div>
      </div>
      {BOARD}
      <div className="flex justify-between items-center w-full mt-1">
        <div className={`text-2xl font-mono ${!playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          Player 2
        </div>
        <div className={`font-mono ${!playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          <Timer 
            timerActive={timeStarted && currentPlayer===1} 
            playerNumber={1} 
            getPlayers={gamePlayers} 
          />
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
            <p className="text-blue-600">You are Player {playerNumber + 1}</p>
            { BOARD_WITH_TIMERS }
          </div>
          <div className="w-1/3 flex flex-col items-center justify-center">
            <div className="p-4 w-full">
              { HISTORY }
              <LiveChat 
                playerNumber={playerNumber}
                onSendMessage={handleSendMessage}
                roomId={roomId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthPage>
  );
}
