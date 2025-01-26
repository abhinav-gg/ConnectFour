'use client';

import GameBoard from '@/components/game/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/game/history';
import { GameState } from '@shared/utils/game';
import { JoinGame, MakeMove, ClientMessage, StartTimer, ServerMessage, SendMessage, MoveMade, ReceiveMessage, PlayerTimeOut } from '@shared/Types/websocketData';
import { PlayerData } from "@shared/Models/gameInfo";
import AuthPage from '@/components/checkAuth';
import Timer from '@/components/game/timer';
import { ChatMessage, EloChange, GamePlayer } from '@shared/Models/gameInfo';
import LiveChat from '@/components/game/chat';
import EndPopup from '@/components/game/endPopup';
import { Player } from '@shared/Types/gameData';

export default function TestingWebsockets() {
  const [timeUpdate, setTimeUpdate] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [socket, setSocket] = useState<WebSocket>();
  const [currentPlayer, setCurrentPlayer] = useState<Player>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const [gameStarted, setGameStarted] = useState(false);
  const [timeStarted, setTimeStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [chatUpdate, setChatUpdate] = useState(0);
  const playerNumber = useRef(-1);
  const eloChangeRef = useRef<EloChange>({ draw: -0, loss: -0, win: -0 });
  const gameBoardRef = useRef<GameState>();
  const messageRef = useRef<ChatMessage[]>([]);
  const resultRef = useRef({winner: -1, deltaElo: 0 });

  const addPlayer = async (username: string, time: number) => {
    // Update to use setState
    const elo = 1000;
    gamePlayers.push({ username, elo: elo, time, timerActive: false });
    setGamePlayers([...gamePlayers]);
  }

  const sendToServer = (data: ServerMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
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

  const turnText = (nextPlayer: number, p1?: number) => {
    if (p1 === nextPlayer) {
      setGameStatus('Your move!');    
    } else if (playerNumber.current === nextPlayer) {
      setGameStatus('Your move!');
    } else {
      setGameStatus('Opponent\'s move...');
    }
  }

  const handleMoveReceived = (data: MoveMade["data"]) => {
    const gameState = gameBoardRef.current;

    if (gameState) {
      const index = gameState.getMoves().length;
      gameState.currentMoveIndex = index - 1;
      gameState.constructFromMoves();
      gameState.currentPlayer = data.nextPlayer ? 0 : 1 as Player;
      if (data.timeLeft > 0) {
        gamePlayers[data.nextPlayer ? 0 : 1].time = data.timeLeft;
        setGamePlayers([...gamePlayers]);
      }
      gameState.makeMove(data.col);
      gameState.currentMoveIndex = index;
      gameState.currentPlayer = data.nextPlayer as Player;
      gameState.constructFromMoves();
      setWaiting(false);
    } 
    else {
      throw new Error('Game state is not initialized!');
    }
    // Update timer active state
    setCurrentPlayer(data.nextPlayer as Player);
    setTimeUpdate(timeUpdate + 1);
  }

  const pushAnnouncement = (message: string) => {
    messageRef.current.push({
      playerNumber: -1,
      username: '',
      message: message,
      isAnnouncement: true
    } as ChatMessage);
    setChatUpdate(prev => prev + 1);
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
    const newSocket = new WebSocket(backendUrl + "/in-game", [token]);
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
          eloChangeRef.current = data.data.eloChanges;
          playerNumber.current = data.data.playerNumber;
          players.forEach((player) => {
            addPlayer(player.username, player.time)
          });
          turnText(0, data.data.playerNumber);
          setGameStarted(true);
          pushAnnouncement('Game started!');
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
        case 'endGame':
          pushAnnouncement("Game Ended")
          setGameStatus(data.data.message);
          if (data.data.draw) {
            console.log('Game ended in a draw!');
            handleGameEnd(true);
          } else if (data.data.winner !== null) {
            handleGameEnd(false, data.data.winner!);
          } else {
            handleGameEnd(true);
          }
          break;
        case 'moveMade':
          handleMoveReceived(data.data);
          turnText(data.data.nextPlayer);
          setTimeUpdate(timeUpdate + 1);
          break;
        case 'playerDisconnected':
          pushAnnouncement('Opponent disconnected...');
          setGameStatus('Opponent disconnected. Waiting for reconnect or timeout...');
          waitForOpponentReconnect();
          break;
        case 'receiveMessage':
          handleMessageReceived(data.data);
          break;
        case 'reconnection':
          pushAnnouncement('You Reconnected!');
          data.data.players.forEach((player) => {
            addPlayer(player.username, player.time)
          });
          eloChangeRef.current = data.data.eloChanges;
          playerNumber.current = data.data.playerNumber;
          setGameStarted(true);
          setTimeUpdate(timeUpdate + 1);
          setTimeStarted(true);
          break;
       
      case "opponentReconnect":
        if (data.data.playerNumber !== -1) {
          turnText(data.data.playerNumber);
          pushAnnouncement('Opponent Reconnected!');
        }
        break;
      
      default:
        console.log('Unknown message:', data);
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

  // Example function to simulate game end
  const handleGameEnd = (draw: boolean, winner?: number) => {
    // Example data, replace with actual game result data
    let deltaElo = 0;
    if (draw) {
      deltaElo = eloChangeRef.current.draw;
    } else if (winner === playerNumber.current) {
      deltaElo = eloChangeRef.current.win;
      console.log('You won!');
    } else {
      deltaElo = eloChangeRef.current.loss;
      console.log('You lost!');
    }
    console.log('Elo change:', deltaElo, winner);
    resultRef.current = { winner: winner ?? -1, deltaElo };
    setTimeStarted(false);
    setTimeUpdate(timeUpdate + 1);
    setShowEndPopup(true);
  };

  const handleMessageReceived = (data: ReceiveMessage["data"]) => {
    if (gamePlayers.length === 0) return;
    messageRef.current.push({
      playerNumber: data.playerNumber, 
      username: gamePlayers[data.playerNumber].username,
      message: data.message,
      isAnnouncement: false
    } as ChatMessage);
    // re-render the live chat here
    setChatUpdate(prev => prev + 1);
  };
    
  const handleMove = (col: number) => {
    if (!gameStarted) return;
    if (waiting) return
    
    setWaiting(true);
    
    sendToServer({ event: 'makeMove', data: { roomId, col } } as MakeMove);
  }

  const waitForOpponentReconnect = () => {
    // create a 10 second timer to wait for the opponent as they have disconnected, then send a timeout query to the server
    setTimeout(() => {
      sendToServer({ event: 'playerTimeOut', data: { roomId } } as PlayerTimeOut);
      setGameStatus('Opponent did not reconnect in time!');
    }, 10000);
  };

  const handleSendMessage = (inputMessage: string) => {
    
    if (!inputMessage.trim() || !socket) return;

    sendToServer({
      event: 'sendMessage',
      data: { roomId: roomId, message: inputMessage }
    } as SendMessage);
  };

  useEffect(() => {
    if (!gameBoardRef.current) {
      gameBoardRef.current = new GameState();
    }
  }, []);

  const BOARD = <GameBoard
  playerNumber={playerNumber.current}
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
        <div className={`text-2xl font-mono ${playerNumber.current ? 'text-red-600' : 'text-gray-600'}`}>
        {gamePlayers[0]?.username ?? 'Player 1'}
        </div>
        <div className={`font-mono ${playerNumber.current ? 'text-red-600' : 'text-gray-600'}`}>
          <Timer 
            key={playerNumber.current}
            timerActive={timeStarted && currentPlayer!==playerNumber.current} 
            playerNumber={(playerNumber.current!==0) ? 0 : 1} 
            getPlayers={gamePlayers} 
          />
        </div>
      </div>
      {BOARD}
      <div className="flex justify-between items-center w-full mt-1">
        <div className={`text-2xl font-mono ${!playerNumber ? 'text-red-600' : 'text-gray-600'}`}>
          {gamePlayers[1]?.username ?? 'Player 2'}
        </div>
        <div className={`font-mono ${!(playerNumber.current===0) ? 'text-red-600' : 'text-gray-600'}`}>
          <Timer 
            key={playerNumber.current}
            timerActive={timeStarted && currentPlayer===playerNumber.current} 
            playerNumber={playerNumber.current} 
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
    <div className="flex min-h-screen bg-gray-100 relative">
      {showEndPopup && (
        <div className="absolute z-50">
          <EndPopup
            playerNumber={playerNumber.current}
            result={resultRef.current}
            players={gamePlayers}
            onRematch={() => {
              console.log('Rematch requested');
              setShowEndPopup(false);
            }}
            onClose={() => setShowEndPopup(false)}
          />
        </div>
      )}
      <Dashboard />
      <div className="flex-1 flex flex-col">
        <div className="flex w-full">
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-xl font-semibold">Room: {roomId}</h2>
            <p className="text-gray-600">{gameStatus}</p>
            <p className="text-blue-600">
              {playerNumber.current === -1 ? 'You are Spectating' : `You are Player ${playerNumber.current + 1}`}
            </p>
            { BOARD_WITH_TIMERS }
          </div>
          <div className="w-1/3 flex flex-col items-center justify-center">
            <div className="p-4 w-full">
              { HISTORY }
              <br/><br/><br/>
              <LiveChat 
                key={chatUpdate}
                pNum={playerNumber.current}
                pMessages={messageRef.current}
                onSendMessage={handleSendMessage}
                onOfferDraw={() => {
                    // Handle draw offer
                }}
                onResign={() => {
                    // Handle resignation
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthPage>
  );
}
