'use client';

import GameBoard from '@/components/game/game-board';
import { useEffect, useRef, useState } from 'react';
import { getConfig } from '@/config/env';
import Dashboard from '@/components/dashboard';
import MoveHistory from '@/components/game/history';
import { GameState } from '@shared/utils/game';
import { JoinGame, MakeMove, ClientMessage, StartTimer, ServerMessage, SendMessage, MoveMade, ReceiveMessage, PlayerTimeOut, OpponentAbandoned, Resign, OfferDraw, AcceptDraw } from '@shared/Types/websocketData';
import AuthPage from '@/components/checkAuth';
import Timer from '@/components/game/timer';
import { ChatMessage, EloChange, GamePlayer } from '@shared/Models/gameInfo';
import LiveChat from '@/components/game/chat';
import EndPopup from '@/components/game/endPopup';
import { DrawMatrix, Player } from '@shared/Types/gameData';
import { StandardReconnectionTime } from '@shared/constants';
import { eventEmitter } from '@shared/utils/eventEmitter'


export default function GamePage() {
  const [timeUpdate, setTimeUpdate] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<Player>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [gameStatus, setGameStatus] = useState('Waiting for players...');
  const [gameStarted, setGameStarted] = useState(false);
  const [timeStarted, setTimeStarted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [chatUpdate, setChatUpdate] = useState(0);
  const [showWaitingPopup, setShowWaitingPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const socket = useRef<WebSocket>();
  const waitingForRecconect = useRef(false);
  const playerNumber = useRef(-1);
  const eloChangeRef = useRef<EloChange>({ draw: -0, loss: -0, win: -0 });
  const gameBoardRef = useRef<GameState>();
  const messageRef = useRef<ChatMessage[]>([]);
  const drawState = useRef<DrawMatrix>({ confirmAction: false, acceptAction: false, offerAction: false });
  const resultRef = useRef({winner: -1, deltaElo: 0 });

  const addPlayer = async (username: string, time: number) => {
    // Update to use setState
    const elo = 1000;
    gamePlayers.push({ username, elo: elo, time, timerActive: false });
    setGamePlayers([...gamePlayers]);
  }

  const sendToServer = (data: ServerMessage) => {
    if (socket && socket.current!.readyState === WebSocket.OPEN) {
      socket.current!.send(JSON.stringify(data));
    } else {
      console.error('Socket not connected!');
    }
  }

  const notLoggedIn = () => {
    console.error('User not logged in!');
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (!roomFromUrl) {
      window.location.href = '/game/setup';
      return;
    } else {
      window.location.href = '/game/setup?room=' + roomFromUrl;
    }
  }

  const turnText = (nextPlayer: number, p1?: number) => {
    if (playerNumber.current === -1) {
      if (nextPlayer === 0) {
        setGameStatus('Red\'s move!'); 
      } else {
        setGameStatus('Yellow\'s move!'); 
      }
    }

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
      window.location.href = '/game/setup';
      return;
    }
    
    setRoomId(roomFromUrl);

    // Pass the token as a protocol
    console.log('Connecting to:', backendUrl);
    const newSocket = new WebSocket(backendUrl + "/in-game"); // ioc: check
    socket.current = newSocket;
    console.log(socket.current);

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
          setShowWaitingPopup(true);
          break;
        case 'gameStart':
          setShowWaitingPopup(false);
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
        case 'endGame':
          pushAnnouncement("Game Ended")
          if (playerNumber.current === -1) 
            break;
          waitingForRecconect.current = false;
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
        case 'playerDisconnected': {
          let timeRemaining = StandardReconnectionTime / 1000;
          pushAnnouncement('Opponent disconnected...');
          waitingForRecconect.current = true;
          const interval = setInterval(() => {
            console.log('Time remaining:', timeRemaining, waitingForRecconect);
            if (!waitingForRecconect) {
              clearInterval(interval);
              return
            };
            setGameStatus(`Waiting for opponent to reconnect. ${timeRemaining}${timeRemaining !== 1 ? 's' : ''} Left!`);
            timeRemaining -= 1;
            if (timeRemaining <= -1) {
              waitingForRecconect.current = false;
              sendToServer({ event: 'opponentAbandoned', data: { roomId: roomFromUrl } } as OpponentAbandoned);
              setGameStatus('Opponent did not reconnect in time!');
              clearInterval(interval);
            }
          }, 1000);
          break;
        }
        case 'receiveMessage':
          handleMessageReceived(data.data);
          break;
        case 'reconnection':
          data.data.players.forEach((player) => {
            addPlayer(player.username, player.time)
          });
          if (data.data.playerNumber === -1) pushAnnouncement('You Are Spectating!');
          else pushAnnouncement('You Reconnected!');
          eloChangeRef.current = data.data.eloChanges;
          playerNumber.current = data.data.playerNumber;
          gameBoardRef.current?.setMoves(data.data.moves);
          turnText(data.data.currentTurn);
          setGameStarted(true);
          setTimeStarted(data.data.moves.length > 0);
          setTimeUpdate(timeUpdate + 1);
          break;
        case "opponentReconnect":
          waitingForRecconect.current = false;
          pushAnnouncement('Opponent Reconnected!');
          turnText(gameBoardRef.current?.currentPlayer ?? 0);
          break;
        case 'drawOffer':
          pushAnnouncement('Opponent offered a draw (you\'re probably winning)!');
          eventEmitter.emit('drawOffered');
          break;
        default:
          console.log('Unknown message:', data);
          break;
      }
    }
  }

  const handlePossibleTimeOut = () => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room')!;
    sendToServer({ event: 'playerTimeOut', data: { roomId } } as PlayerTimeOut);
  }

  const handleDrawAccept = () => {
    // get roomId form params
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room')!;
    pushAnnouncement('You agreed to a draw (cringe)!');
    if (playerNumber.current === -1) return;
    sendToServer({ event: 'acceptDraw', data: { roomId: room } } as AcceptDraw);
  }

  const handleAttemptResign = () => {
    // get roomId form params
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room')!;
    pushAnnouncement('You resigned (haha loser)!');
    if (playerNumber.current === -1) return;
    sendToServer({ event: 'resign', data: { roomId: room } } as Resign);
  }

  const handleDrawOffer = () => {
    // get roomId form params
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room')!;
    pushAnnouncement('You offered to draw (cringe)!');
    if (playerNumber.current === -1) return;
    sendToServer({ event: 'offerDraw', data: { roomId: room } } as OfferDraw);
  }

  const handleCopyLink = () => {
    const roomLink = `${window.location.origin}/game?room=${roomId}`;
    navigator.clipboard.writeText(roomLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {

    eventEmitter.on('tryResign', handleAttemptResign);
    eventEmitter.on('tryDraw', handleDrawOffer);
    eventEmitter.on('acceptDraw', handleDrawAccept);

    return () => {

      eventEmitter.off('tryResign', handleAttemptResign);
      eventEmitter.off('tryDraw', handleDrawOffer);
      eventEmitter.off('acceptDraw', handleDrawAccept);

      console.log('Closing WebSocket connection...');
      socket.current?.close();
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

  const topPlayer = (playerNumber.current === -1) ? 0 : Math.abs(1-playerNumber.current);
  const bottomPlayer = (playerNumber.current === -1) ? 1 : playerNumber.current;
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
    <div className="flex flex-col items-center w-full max-w-[600px]">
      <div className="flex justify-between items-center w-full mb-1 px-2">
        <div className={`text-lg sm:text-2xl font-mono ${(topPlayer===0) ? 'text-red-600' : 'text-gray-600'}`}>
          {gamePlayers[topPlayer]?.username}
        </div>
        <div className={`font-mono ${(topPlayer === 0) ? 'text-red-600' : 'text-gray-600'}`}>
          <Timer 
            key={playerNumber.current}
            timerActive={timeStarted && currentPlayer===topPlayer} 
            playerNumber={topPlayer} 
            getPlayers={gamePlayers} 
            onTimeout={handlePossibleTimeOut}
          />
        </div>
      </div>
      <br/>
      <div className="flex items-center justify-center w-[90%] h-[90%]">
          {BOARD}
        </div>
      <div className="flex justify-between items-center w-full mt-1 px-2">
        <div className={`text-lg sm:text-2xl font-mono ${!(bottomPlayer===0) ? 'text-red-600' : 'text-gray-600'}`}>
          {gamePlayers[bottomPlayer]?.username}
        </div>
        <div className={`font-mono ${!(bottomPlayer===0) ? 'text-red-600' : 'text-gray-600'}`}>
          <Timer 
            key={playerNumber.current}
            timerActive={timeStarted && currentPlayer===bottomPlayer} 
            playerNumber={bottomPlayer}
            getPlayers={gamePlayers} 
            onTimeout={handlePossibleTimeOut}
          />
        </div>
      </div>
    </div>
  );

  return (
  <AuthPage
    onAuthSuccess={connectedUser}
    onAuthFail={notLoggedIn}>
  <div className="bg-gray-100 w-full">
    <div className="flex min-h-screen bg-gray-100 relative w-full">
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
      {showWaitingPopup && (
        <div className="absolute z-50 bg-white p-4 border rounded shadow-lg w-11/12 md:w-1/4 left-1/2 transform -translate-x-1/2 top-1/4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Waiting for Opponent...</h2>
            <button 
              onClick={() => setShowWaitingPopup(false)} 
              className="text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>
          </div>
          <p className="text-gray-600">Please wait while your opponent joins the game.</p>
          <h2 className="text-2xl font-bold mt-4" style={{ fontFamily: 'Courier New, monospace' }}>Room ID: {roomId}</h2>
          <button 
            onClick={handleCopyLink} 
            className="mt-4 bg-blue-500 text-white p-2 rounded transition-transform transform hover:scale-105"
          >
            {copied ? 'Copied!' : 'Copy Game Link'}
          </button>
        </div>
      )}
      <Dashboard 
        closed={true}/>
      <div className="flex-1 flex flex-col w-full">
        <div className="flex flex-col lg:flex-row w-full p-2 md:p-4 gap-4">
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-bold mt-2 md:mt-4" style={{ fontFamily: 'Courier New, monospace' }}>Room ID: {roomId}</h2>
            <p className="text-gray-600 text-center">{gameStatus}</p>
            <p className="text-blue-600 text-center mb-2 md:mb-4">
              {playerNumber.current === -1 ? 'You are Spectating' : `You are Player ${playerNumber.current + 1}`}
            </p>
            <div className="w-full flex justify-center px-2">
              {BOARD_WITH_TIMERS}
            </div>
          </div>
          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4">
            <div className="w-full">
              {HISTORY}
            </div>
            <div className="w-full">
              <LiveChat 
                key={chatUpdate}
                pNum={playerNumber.current}
                pMessages={messageRef.current}
                pDrawMatrix={drawState.current}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </AuthPage>
  );
}
