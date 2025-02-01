import expressWs from "express-ws";
import type { WebSocket as WSocket } from "ws";
import type { Room, RoomMap } from "@/types/types";
import type { Error, GameStart, JoinGame, MakeMove, ServerMessage, MoveMade, 
  PlayerDisconnected, PlayerJoined, StartTimer, ClientMessage, EndGame, PlayerTimeout, ReceiveMessage, SendMessage, 
  PlayerReconnected,
  OpponentReconnect,
  DrawOffer} from "@shared/Types/websocketData";
import { dbOperations } from "@/db/operations";
import { getUserFromSession } from "@/lib/auth";
import { UUID } from "crypto";
import { EloChange, GameMode, PlayerData, SendToRoom, TimeControl } from "@shared/Models/gameInfo";
import { StandardGameStates, StandardReconnectionTime } from "@shared/constants";
import { GameState } from "@shared/utils/game";
import { abortGame, assignGame, calculateTimesByMoves, endGame, safeGetElo } from "./gameHelper";
import { replaceProfanities } from 'no-profanity';
import { Game } from "@/models/Game";
import { calculateGlickoRatings } from "./matchmaking";

const state : RoomMap = {
  rooms: new Map<string, Room>()
};

const emptyEloChange: EloChange = { win: -0, draw: -0, loss: -0 };

type UserCachedSocket = {
  userID: string | null;
  token: string;
  username: string | null; // cached for speed
  eloChange: EloChange;
  socket: WSocket;
}

const SocketIDs = [] as UserCachedSocket[];


function getRoom(room: string) {
  return state.rooms.get(room);
}

function getUsernameByID(userID: string): string {
  return SocketIDs.find(s => s.userID === userID)!.username ?? 'Anonymous';
}

function getSocket(userID: string): UserCachedSocket | undefined {
  return SocketIDs.find(s => s.userID === userID);
}

function getUser(socket: WSocket): UserCachedSocket {
  return SocketIDs.find(s => s.socket === socket)!;
}

function addSocket(token: string, socket: WSocket) {
  SocketIDs.push({ userID: null, token , username: null, eloChange: emptyEloChange, socket });
}

function getEloChange(userID: string): EloChange {
  return SocketIDs.find(s => s.userID === userID)!.eloChange;
}

function setEloChange(userID: string, eloChange: EloChange) {
  for (let i = 0; i < SocketIDs.length; i++) {
    if (SocketIDs[i].userID === userID) {
      SocketIDs[i].eloChange = eloChange;
      return;
    }
  }
}

function removeSocket(userID: string) {
  for (let i = 0; i < SocketIDs.length; i++) {
    if (SocketIDs[i].userID === userID) {
      SocketIDs.splice(i, 1);
      return;
    }
  }
}

function getTimeControl(roomid: string) {
  return getRoom(roomid)?.gameInfo?.time_control;
}

function getGameMode(roomid: string): GameMode | undefined {
  return getRoom(roomid)?.gameInfo?.gamemode;
}

function makeRoom(roomid: string, gamemode: GameMode, time_control: TimeControl) {
  state.rooms.set(roomid, {
    players: [],
    spectators: [],
    gameInfo: { gamemode, time_control },
    currentTurn: 0
  });
}

function dropRoom(roomid: string) {
  state.rooms.delete(roomid);
}

function setupRematch(roomid: string, GMM: string) {
  // extremely complicated, will be done later
  // reqs:
    // check if the game is over
    // switch the players order so p1 is now p2 and vice versa
    // end old game and create new game
    // redirect both players to new game 
    // for friendly, no need for special setup can assume they joined the new game at the same time
    // for matchmaking games add the players to the gameplayers table
    // This should then integrate with the normal systems

    // use new websocket server for this 
}

async function getCompetitiveEloChange(userId: string, opponentId: string, roomId: string): Promise<EloChange> {
  const gamemodeId = await dbOperations.GetGameModeID(getGameMode(roomId)!);
  const me = await safeGetElo(userId, gamemodeId);
  const them = await safeGetElo(opponentId, gamemodeId);
  return calculateGlickoRatings(me, them);
}

async function setupPlayer(userId: string) {
  const user = await dbOperations.getUserByID(userId);
  if (!user) return;
  if (!SocketIDs.find(s => s.userID === userId)) {
    throw new Error('User is not connected');
  }
  else {
    SocketIDs.forEach(s => {
      if (s.userID === userId) {
        s.username = user.username ? user.username : 'Anonymous';
      }
    });
  }
}

async function reconnect(roomId: string, userId: string, newSocket: WSocket, isSpectator: boolean = false) {
  // Check if the room is still ongoing
  // If it is then add the new socket to the room and remove the old one
  console.log('Reconnecting:', roomId, userId, isSpectator);
  const game = await dbOperations.GetGameByShortCode(roomId);
  if ((game.state !== StandardGameStates.scheduled &&
    game.state !== StandardGameStates.ongoing)) {
    throw new Error('Game is not ongoing');
  }

  const room = getRoom(roomId);
  if (!room) throw new Error('Room does not exist???');
  
  const usersock = getSocket(userId);
  if (!usersock) throw new Error('no user???');
  if (!usersock.username) {
    await setupPlayer(userId);
  }
  
  // Gather all game data from the database
  const lookup = await dbOperations.GetGameByPlayerLookup(userId);
  const moves = await dbOperations.GetMovesByShortCode(roomId);
  const p1 = room.players[0];
  const timeControl = getTimeControl(roomId)!;
  const gameMode = getGameMode(roomId)!;
  let playerNumber = -1;
  const roomPlayers = room.players.map(p => {
    return { username: getUsernameByID(p),
      time: calculateTimesByMoves(moves, p, timeControl, p!==p1).timeLeft
    }});
  let eloChanges: EloChange = emptyEloChange;

  if (isSpectator) {
    room.spectators.push(userId as UUID);
    newSocket.send( JSON.stringify({
      event: 'reconnection',
      data: {
        playerNumber: playerNumber,
        currentTurn: room.currentTurn,
        players: roomPlayers as PlayerData[],
        moves: moves.map(m => m.col) as number[]
      }
    } as PlayerReconnected));
    return;

  } else if (game.id === lookup) {

    switch (gameMode.name.split('-')[0]) {
      case 'standard': {
        const opponentId = room.players[0] === userId ? room.players[1] : room.players[0];
        eloChanges = await getCompetitiveEloChange(userId, opponentId, roomId);
        break;
      }
      case 'friendly': {
        break;
      }
    }
    playerNumber = room.players.indexOf(userId as UUID);
    console.log(room, userId, playerNumber);
    newSocket.send(JSON.stringify({
      event: 'reconnection',
      data: {
        eloChanges: eloChanges,
        playerNumber: playerNumber,
        currentTurn: room.currentTurn,
        players: roomPlayers as PlayerData[],
        moves: moves.map(m => m.col) as number[]
      }
    } as PlayerReconnected));
  }
  else {
    throw new Error('Game is not ongoing');
  }

  // send PlayerReconnected to the other players
  room.players.forEach(player => {
    if (player !== userId) {
      getSocket(player)?.socket.send(JSON.stringify({
        event: 'opponentReconnect',
        data: { playerNumber: playerNumber }
      } as OpponentReconnect));
    }
  });
}

function joinRoom(roomid: string, player: string) {
  const room = getRoom(roomid);
  if (room) {
    room.players.push(player as UUID);
  } else {
    throw new Error(`This error shouldn't event be possible`);
  }
}

function sendToRoom(roomId: string, data: ClientMessage) {
  const room = getRoom(roomId);
  if (!room) return;

  const wsData = JSON.stringify(data);
  const playersAndSpectators = room.players.concat(room.spectators);
  playersAndSpectators.forEach(playerId => {
    const socket = getSocket(playerId)?.socket;
    if (socket) {
      socket.send(wsData);
    }
  });
};

function getRoomOfPlayer(userId: string): string|null {
  let found: string | null = null;
  state.rooms.forEach((room, roomId) => {
    if (room.players.includes(userId as UUID) || room.spectators.includes(userId as UUID))
      found = roomId;
  });
  return found;
}

/////////////////////////////////////////////////////////////

type verificationData = {
  delta: number;
  timeLeft: number;
  turn: number;
  nextPlayer: number;
  draw: boolean;
  winner: number | null;
}

async function verifyStandardGame(roomId: string, userId: string, col: number): Promise<verificationData> {
  const timecontrol = getTimeControl(roomId)!;
  const room = getRoom(roomId)!;
  
  // Verify the correct player is sending the move
  if (room.currentTurn !== room.players.indexOf(userId as UUID)) {
    return {
      delta: 0,
      timeLeft: -1,
      turn: -1,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: null
    } as verificationData;
  }
  
  // Verify the time left here and calculate the time delta
  const moves = await dbOperations.GetMovesByShortCode(roomId);
  const turn = moves.length + 1;
  room.currentTurn = room.currentTurn === 0 ? 1 : 0;
  let { timeTaken, allowedTime, timeLeft, delta } = calculateTimesByMoves(moves, userId, timecontrol, 
    room.currentTurn === 0);
  
  if (moves.length == 0) {
    return {
      delta: 0,
      timeLeft: timeLeft,
      turn: 1,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: null
    } as verificationData;
  }
  
  timeLeft += timecontrol.increment * 1000;
  if (timeTaken >= allowedTime){
    return {
      delta: delta,
      timeLeft: 0,
      turn: turn,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: room.currentTurn
    } as verificationData;
  }

  // Verify game here
  const intMoves = moves.map(m => { return m.col }) as number[]
  intMoves.push(col);
  const gameState = new GameState();
  intMoves.forEach((col) => {
    let res = gameState.makeMove(col, true);
    if (!res.success)
      throw new Error('Invalid move');
  });
  if (gameState.gameOver) {
    if (gameState.winner === null) {
      return {
        delta: delta,
        timeLeft: timeLeft,
        turn: turn,
        nextPlayer: room.currentTurn,
        draw: true,
        winner: null
      } as verificationData;
    }
    return {
      delta: delta,
      timeLeft: timeLeft,
      turn: turn,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: room.currentTurn ? 0 : 1
    } as verificationData;
  }
  else {
    return {
      delta: delta,
      timeLeft: timeLeft,
      turn: turn,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: null
    } as verificationData;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

async function handleGameEnd(roomId: string, draw: boolean, message: string, winner?: number) {
  // Simply close the websocket for this game because the room can never be reused
  // players will be redirected to a new game id in the frontend if they want to rematch

  console.log('GAME ENDING:', roomId, draw, message, winner);

  const room = getRoom(roomId);
  if (!room) return; // Strange error

  room.gameOver = true;
  sendToRoom(roomId, {
    event: "endGame",
    data: { 
      winner: winner, 
      draw: draw,
      message: message }
  } as EndGame);

  // No real need to await this
  endGame(roomId, room.gameInfo.gamemode, draw, winner);

  // TODO: send user to the waiting websocket page.
  // Mark game as finished depending on state
};

async function startNormalGame(room: Room, gamemode: GameMode, time_control: TimeControl) {
  const p1Time: number = time_control!.base_time*60000;
  const p2Time: number = p1Time + time_control!.disadvantage*1000; 

  switch (gamemode.name.split('-')[0]) {
    case 'standard': {
      room.players.forEach(async (player, index) => {
        getSocket(player)!.socket.send(JSON.stringify({
        event: "gameStart",
        data: {
          eloChanges: getEloChange(player),
          playerNumber: index,
          players: [
            { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
            { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
            ]
          }
        } as GameStart));
      });
      break;
    }
    case 'friendly': {
      room.players.forEach((player, index) => {
        getSocket(player)!.socket.send(JSON.stringify({
        event: "gameStart",
        data: {
          eloChanges: emptyEloChange,
          playerNumber: index,
          players: [
            { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
            { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
            ]
          }
        } as GameStart));
      });
      break;
    }
  }
  room.spectators.forEach(spectator => {
    getSocket(spectator)!.socket.send(JSON.stringify({
    event: "gameStart",
    data: {
      eloChanges: {},
      playerNumber: -1,
      players: [
        { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
        { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
        ]
      }
    } as GameStart));
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const setupGameEvents = async (app: expressWs.Application) => {
  app.ws('/in-game', (ws, req) => {
    console.log('Client connected');

    console.log("cookies:", req.cookies); // debug

    const token = req.cookies.sessionToken;

    if (!token) {
      console.log('Not Logged In');
      ws.send(JSON.stringify({ event: 'error', data: { message: 'Not Logged In' } } as Error));
      ws.close();
      return;
    }

    if (!getUser(ws)) {
      addSocket(token, ws)
    }

    ws.on('message', async (message) => {
      try {
        // console.log('Received message:', message);
        const data: ServerMessage = JSON.parse(message.toString());
        console.log('Parsed message:', data);

        const user = getUser(ws);
        if (!user.userID) {
          const auth = await getUserFromSession(user!.token as string);
          console.log('Auth:', auth);
          if (!auth.userId) {
            ws.send(JSON.stringify({ event: 'error', data: { message: 'Not Logged In' } } as Error));
            ws.close();
            return;
          }
          user.userID = auth.userId;
        }
        // Handle incoming messages
/////////////////////////////////////////////////////////////////////////////
        switch (data.event) {
          case 'joinGame': {
            
            const { roomId } = data.data as JoinGame["data"]; // follow datatype of JoinGame
            const userId = user.userID;

            console.log('Join Game:', roomId, userId);

            if (!roomId || !userId) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
              return;
            }

            // Check if the user is already in the room
            if (getRoomOfPlayer(userId) === roomId) {
              await reconnect(roomId, userId, ws);
              return; 
            }

            // Check if the current room is ongoing in database - if not then close websocket and instead use old game viewer
            let game: Game;

            try {
              game = await dbOperations.GetGameByShortCode(roomId);

              if (!game) {
                ws.send(JSON.stringify({ event: 'error', data: { message: 'Game not found', redirect: '/game/setup' } }));
                return;
              } else if (game.short_id !== roomId) {
                ws.send(JSON.stringify({ event: 'error', data: { message: 'Player in another game', redirect: `/game?room=${game.short_id}` } }));
                return;
              }

              if (game.state === StandardGameStates.ongoing) {
                // else let the user spectate the game
                await reconnect(roomId, userId, ws, true);
                return;
              } else if (game.state !== StandardGameStates.scheduled) {
                // TODO: replace with analysis later
                ws.send(JSON.stringify({ event: 'error', data: { message: 'Game Ended', redirect: "/game/setup" } }));
                return;
              }
            }
            catch (error) {
              console.log('Failed to check if game is ongoing:', error);
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Failed to check if game is ongoing', redirect: '/game' } }));
              return;
            }

            // make the room cache if it doesn't exist (p1 join)
            let gamemode = getGameMode(roomId);
            let time_control = getTimeControl(roomId);
            const roomExists = state.rooms.has(roomId);
            try {
              if (!roomExists) {
                gamemode = await dbOperations.GetGameModeFromShortCode(roomId);
                time_control = await dbOperations.GetTimeControlFromShortCode(roomId);
                makeRoom(roomId, gamemode, time_control);
              }
            }
            catch (error) {
              console.log('Failed to check if room exists:', error);
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Failed to check if room exists', redirect: '/game' } } as Error));
              return;
            }

            const room = getRoom(roomId)!;
            await setupPlayer(userId);

            const StandardConnectUser = () => {
              joinRoom(roomId, userId);
              const room = getRoom(roomId)!;
                            
              ws.send(JSON.stringify({
                event: 'playerJoined',
                data: { 
                  gameInfo: room.gameInfo,
                }
              } as PlayerJoined)); // Use the types for type checking
              
              // standard friendly gamemode starts with 2 players (current socket added above)
              if (room.players.length === 2) {
                switch (gamemode!.name.split('-')[0]) {
                  case 'standard': {
                    room.players.forEach(async (player, index) => {
                      const eloChange = await getCompetitiveEloChange(player, room.players[index == 0 ? 1 : 0], game.short_id);
                      setEloChange(player, eloChange);
                    });
                    break;
                  }
                  case 'friendly': {
                    if (gamemode!.name === "friendly") { // friendly game
                      room.players.forEach((player, index) => {
                        assignGame(game.id, player, index);
                      });
                    }
                    break;
                  }
                }
                startNormalGame(room, gamemode!, time_control!);
              }
            }

            ///////////////////// IMPORTANT ////////////////////////
            // Check the user is one of the two players in the game
            // If not then enter spectating mode, for now return

            switch (gamemode!.name.split('-')[0]) {

              case 'standard': {

                // Check if the user is one of the players in the game
                const gameLookup = await dbOperations.GetGameByPlayerLookup(userId);

                if (!gameLookup || gameLookup !== game.id) {
                  // If not then enter spectating mode, for now return
                  reconnect(roomId, userId, ws, true);
                  return;
                }

                
                console.log(room)
                StandardConnectUser();
                break;
              }
              case 'friendly': {

                // Check that the user is free to join the room
                try {

                  // REWRITE THE BELOW
                    // Check if the user is already in a game
                    // If not add them to gamelookup if they are not already in it
                  // Check that the room has room for another player
                  
                  if (room.players.length >= 2){
                    reconnect(roomId, userId, ws, true);
                    return;
                  }
                  
                  const gameLookup = await dbOperations.GetGameByPlayerLookup(userId);
                  if (gameLookup) {
                    if (gameLookup !== game.id) {
                      console.log("Found game by player:", userId, gameLookup);
                      const theirGame = await dbOperations.GetGameByID(gameLookup);
                      if (theirGame.state === StandardGameStates.ongoing) {
                        ws.send(JSON.stringify({ event: 'sendToRoom', data: { roomId: theirGame.short_id } } as SendToRoom));
                        return;
                      } else if (theirGame.state === StandardGameStates.scheduled) {
                        await dbOperations.FinishedGameLookup(userId);
                      }
                    }
                  }
                  else {
                    await dbOperations.BeginFindingGame(userId, game.game_info, game.id);
                  }
                }
                catch (error) {
                  console.error('Failed to check if user is free to join room:', error);
                  ws.send(JSON.stringify({ event: 'error', data: { message: 'Failed to check if user is free to join room' } }));
                  return;
                }

                // Player is connecting to the game for the first time.
                // Send the game state to the player and update the room state

                StandardConnectUser();
                // Assign the game to the players (for friendly game no elo change)
                
                break;
              }
              default : {
                // The game mode does not exist??
                throw new Error('Game mode does not exist');
              }
            }
            break;
          }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          case 'makeMove': {

            // assume player is authenticated by wss
            // fetch all moves from db for validation of move
            // check it is the correct player's turn
            // insert the move in the database and send the move to the other player

            
            // read from MoveMade
            const { roomId, col } = data.data as MakeMove["data"];
            if (!roomId || (col === null)) {
              ws.send(JSON.stringify({ event: 'error', data: { error: 'Invalid data by frontend' } }));
              return;
            }
            const room = getRoom(roomId);
            const userId = user.userID;
            
            if (!room || !userId || !(getRoomOfPlayer(userId))) {
              // fix this to re-create the room by getting the user to refresh their page
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data on backend' } }));
              return;
            }
            
            if (room.gameOver) return;
            // The player and room have been fully verified
            room.drawing = false; // cancel any draw offers
            const gamemode = getGameMode(roomId);

            let verification: verificationData;

            switch (gamemode?.name.split('-')[0]) {
              case 'friendly': 
              case 'standard' : {

                try {
                  verification = await verifyStandardGame(roomId, userId!, col);
                  console.log('Verification:', verification);
                }
                catch (error) {
                  console.error('Failed to verify standard game:', error);
                  ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid Move' } }));
                  return;
                }

                break;
              }
              default: {
                throw new Error('Game mode does not exist');
              }
            }

            // much like chess.com we do not start the timer until the first move is made
            if (verification.turn === -1) {
              return;
            } else if (verification.turn === 1) {
              dbOperations.UpdateGameStatusByShortCode(roomId, StandardGameStates.ongoing);
              sendToRoom(roomId, {
                event: 'startTimer',
              } as StartTimer);
            } 
            
            if (verification.timeLeft <= 0) { 
              handleGameEnd(roomId, false, `Player ${verification.nextPlayer + 1} timed out`, verification.winner!);
            }

            try {
              // consider speed, will this write to the database in time for the next move??
              const gameId = (await dbOperations.GetGameByShortCode(roomId))?.id;
              await dbOperations.MakeMove(gameId, userId, verification.turn, col, verification.delta);
            }
            catch (error) {
              console.error('Failed to send move to database');
              return;
            }

            sendToRoom(roomId, {
              event: 'moveMade',
              data: { 
                nextPlayer: verification.nextPlayer, 
                col: col,
                timeLeft: verification.timeLeft
              }
            } as MoveMade)

            if (verification.draw) {
              handleGameEnd(roomId, true, 'Game Over', -1);
            } else if (verification.winner !== null) {
              handleGameEnd(roomId, false, 'Game Over', verification.winner);
            }            
            break;
          }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          case 'sendMessage': { 
            const { roomId, message } = data.data as SendMessage["data"];
            const userId = getUser(ws)?.userID;
            if (!getRoomOfPlayer(userId!)) throw new Error('User is not in the room to chat');

            if (!roomId || !message) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
              return;
            }
            //const filter = new Filter();
            const cleanedMessage = replaceProfanities(message);

            const playerNum = getRoom(roomId)!.players.indexOf(userId as UUID);
            if (playerNum === -1) throw new Error('Room Index Failed');
            sendToRoom(roomId, {
              event: 'receiveMessage',
              data: { playerNumber: playerNum, message: cleanedMessage }
            } as ReceiveMessage);
            
            break;
          } // TODO: allow chatting, not a priority, messages are not stored, use profanity filter

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
          case 'playerTimeOut': {
            // Check the player really did timeout and then end the game

            const roomId = data.data.roomId;
            const room = getRoom(roomId);
            if (room!.gameOver) return;
            const user = getUser(ws)?.userID
            if (!(getRoomOfPlayer(user!) === roomId)){
              console.error("Player is not in the room");
              return;
            }

            const timecontrol = getTimeControl(roomId)!;
            const moves = await dbOperations.GetMovesByShortCode(roomId);
            const player = room!.players[room!.currentTurn];
            const index = room!.currentTurn;

            const { timeLeft } = calculateTimesByMoves(moves, player, timecontrol, index===1);
            if (timeLeft <= 0) {
              const timeOutName = getUsernameByID(room!.players[index]);
              handleGameEnd(roomId, false, `${timeOutName} timed out`, index===0 ? 1 : 0);
              return;
            }

            break;
          }
          case 'opponentAbandoned': {
            // Check time since they left
            const roomId = data.data.roomId;
            const user = getUser(ws)?.userID
            if (!(getRoomOfPlayer(user!) === roomId)){
              console.error("Player is not in the room");
              return;
            }
            const room = getRoom(roomId)!;
            if (room.gameOver) return;
            const gamemode = getGameMode(roomId)!;

            const findDisconnectedPlayers = room.players.filter(p => !getSocket(p));

            const timeSince = Date.now() - room.lastDisconnect!;
            if (timeSince < StandardReconnectionTime) {
              sendToRoom(roomId,
                { 
                  event: 'error', 
                  data: { message: 'Opponent has time to reconnect' } 
                } as Error);
              return;
            }

            switch (gamemode.name.split('-')[0]) {
              case 'friendly':
              case 'standard': {
                if (findDisconnectedPlayers.length === 1) {
                  const winner = room.players.indexOf(findDisconnectedPlayers[0]) === 0 ? 1 : 0;
                  handleGameEnd(roomId, false, 'Opponent abandoned', winner);
                } else {
                  throw new Error('Both players are disconnected or something stranger is happening');
                }
                break;
              }
            }
            break;
          }
          case 'resign': {
            const roomId = data.data.roomId;
            const user = getUser(ws)?.userID!
            if (!(getRoomOfPlayer(user) === roomId)) throw new Error('User is not in the room to timeout');
            const moves = await dbOperations.GetMovesByShortCode(roomId);
            if (moves.length === 0) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Cannot resign on the first move (ya nerd)' } }));
            }
            const room = getRoom(roomId)!;
            if (room.gameOver) return;
            const player = room.players.indexOf(user as UUID);
            const winner = player === 0 ? 1 : 0;
            handleGameEnd(roomId, false, 'Player resigned', winner);
            break;
          }
//////////////////////////////////////////////////////////////////////////////////////////////////////
          case 'offerDraw': { 
            const roomId = data.data.roomId;
            const user = getUser(ws)?.userID!
            if (!(getRoomOfPlayer(user) === roomId)) throw new Error('User is not in the room to timeout');
            const room = getRoom(roomId)!;
            if (room.gameOver) return;
            const player = room.players.indexOf(user as UUID);
            const opponent = player === 0 ? 1 : 0;
            getSocket(room.players[opponent])?.socket.send(JSON.stringify({
              event: 'drawOffer',
            } as DrawOffer));
            room.drawing = true;
            break;
          }
          case 'acceptDraw': {
            const roomId = data.data.roomId;
            const user = getUser(ws)?.userID!
            if (!(getRoomOfPlayer(user) === roomId)) throw new Error('User is not in the room to timeout');
            const room = getRoom(roomId)!;
            if (room.gameOver) return;
            if (!room.drawing) return;
            handleGameEnd(roomId, true, 'Draw by agreement');
            break;
          }

          default:
            console.log('Unknown event:', JSON.stringify(data));
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Move Error' } }));
      }
    });

    ws.on('error', (error) => {
        console.error('Websocket error:', error);
    });

    ws.on('close', async () => {
      // gracefully handle disconnections as player may reconnect
      const userId = getUser(ws)?.userID!;
      console.log('Client disconnected:', userId);
      
      // check if the user was in a game - if so then send a message to the other player
      // TODO: if the other player is not connected then idfk
      const roomId = getRoomOfPlayer(userId)
      
      if (userId) {
        removeSocket(userId);
      }

      if (!roomId) {
        console.log("User was not in a room", state.rooms.keys());
        ws.close();
        return; // player was between rooms or seomthing
      }

      const room = getRoom(roomId!)!;

      room.lastDisconnect = Date.now();

      if (room.spectators.includes(userId as UUID)) {
        // simply drop the spectator and continue
        room.spectators = room.spectators.filter(p => p !== userId);
        ws.close();
        return
      }

      const game = await dbOperations.GetGameByShortCode(roomId!);
      if (!game) {
        console.error('Game not found:', roomId);
        // simply drop the room and continue
        dropRoom(roomId!);
        ws.close();
        return;
      }

      console.log('Game is scheduled:', game);
      if (game.state === StandardGameStates.scheduled) {
        dbOperations.KillGame(game.id);
        dropRoom(roomId);
        ws.close();
        return;
      }

      // Therefore the user is in a ongoing game
       
      sendToRoom(roomId, {
        event: 'playerDisconnected',
        data: {}
      } as PlayerDisconnected);

      let active = 0;

      room.players.forEach(player => {
        if (getSocket(player)) {
          active++;
        }
      });
  
      // the player has some time to return if there are other players so do nothing
      if (active === 0) {
        await handleGameEnd(roomId, true, 'abandoned');
        dropRoom(roomId);
      }

      ws.close();
   
    });
  });
};
