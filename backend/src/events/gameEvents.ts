import expressWs from "express-ws";
import type { WebSocket as WSocket } from "ws";
import type { Room, RoomMap } from "../types/types";
import type { Error, GameStart, JoinGame, MakeMove, ServerMessage, MoveMade, PlayerData, PlayerDisconnected, PlayerJoined, StartTimer, ClientMessage } from "@shared/Types/websocketData";
import { dbOperations } from "@/db/operations";
import { verifyAccessToken } from "@/lib/auth";
import { UUID } from "crypto";
import { GameInfo, GameMode, TimeControl } from "@shared/Models/gameInfo";
import { StandardGameStates } from "@shared/constants";
import { assert } from "console";
import { GameState } from "@shared/utils/game";
import { assignGame } from "./gameHelper";

const state : RoomMap = {
  rooms: new Map<string, Room>()
};

type UserCachedSocket = {
  userID: string;
  username: string | null;
  elo: number | null;
  socket: WSocket;
}

const SocketIDs = [] as UserCachedSocket[];


function getRoom(room: string) {
  return state.rooms.get(room);
}

function playerInRoom(room: string, player: string): boolean {
  return getRoom(room)?.players.includes(player as UUID) ?? false;
}

function getUsernameByID(userID: string): string {
  return SocketIDs.find(s => s.userID === userID)!.username!;
}

function getSocket(userID: string) {
  return SocketIDs.find(s => s.userID === userID);
}

function getUser(socket: WSocket): UserCachedSocket {
  return SocketIDs.find(s => s.socket === socket)!;
}

function addSocket(userID: string, socket: WSocket) {
  SocketIDs.push({ userID, username: null, elo: null, socket });
}

function removeSocket(userID: string) {
  const index = SocketIDs.findIndex(s => s.userID === userID);
  if (index !== -1) {
    SocketIDs.splice(index, 1);
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
    gameInfo: { gamemode, time_control },
    currentTurn: 0
  });
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
}

async function setupPlayer(userId: string, gamemode: GameMode) {
  const gmid = await dbOperations.GetGameModeID(gamemode);
  const user = await dbOperations.getUserByID(userId);
  const elo = 1000 // await dbOperations.GetPlayerElo(userId, gmid);
  if (!user) return;
  if (!SocketIDs.find(s => s.userID === userId)) {
    throw new Error('User is not connected');
  }
  else {
    SocketIDs.forEach(s => {
      if (s.userID === userId) {
        s.username = user.username || 'Anonymous';
        s.elo = elo;
      }
    });
  }
}

function reconnect(roomId: string, userId: string){

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

  room.players.forEach(playerId => {
    const socket = getSocket(playerId)?.socket;
    if (socket) {
      socket.send(wsData);
    }
  });
};

function getRoomOfPlayer(userId: string): string|null {
  state.rooms.forEach((room, roomId) => {
    if (room.players.includes(userId as UUID))
      return roomId
  })
  return null
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
  room.currentTurn = room.currentTurn === 0 ? 1 : 0;
  
  if (moves.length == 0) {
    return {
      delta: 0,
      timeLeft: -1,
      turn: 1,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: null
    } as verificationData;
  }
  
  let timeTaken = 0; // calculate time taken
  let allowedTime = 0; // get allowed time from time control
  const movesByPlayer = moves.filter(m => m.player === userId);
  timeTaken = movesByPlayer.reduce((acc, m) => acc + m.delta, 0);

  if (userId === room?.players[1]) {
    allowedTime += timecontrol.disadvantage * 1000;
  }
  allowedTime += (timecontrol.base_time * 60000)
              +  (timecontrol.increment * movesByPlayer.length * 1000);

  const lastMoveMadeTime = moves[moves.length - 1].played_at * 1000; // db stores in seconds
  const currentTime = new Date().getTime(); // debug this
  const delta = currentTime - lastMoveMadeTime;
  const timeLeft = allowedTime - timeTaken - delta + timecontrol.increment * 1000;
  console.log('Time:', lastMoveMadeTime, currentTime, delta, timeLeft);
  if (timeTaken > allowedTime){
    return {
      delta: delta,
      timeLeft: timeLeft,
      turn: -1,
      nextPlayer: -1,
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
        turn: -1,
        nextPlayer: -1,
        draw: true,
        winner: null
      } as verificationData;
    }
    return {
      delta: delta,
      timeLeft: timeLeft,
      turn: -1,
      nextPlayer: -1,
      draw: false,
      winner: room.currentTurn ? 1 : 0
    } as verificationData;
  }
  else {
    return {
      delta: delta,
      timeLeft: timeLeft,
      turn: moves.length + 1,
      nextPlayer: room.currentTurn,
      draw: false,
      winner: null
    } as verificationData;
  }
}

function endGame(roomId: string, draw: boolean, winner: string) {

  // something like this?

  const status = draw ? 'draw' : winner;
  handleGameEnd(roomId, status); // just handles closing the websocket, not DB updates
}


async function handleGameEnd(roomId: string, status: string) {
  // Simply close the websocket for this game because the room can never be reused
  // players will be redirected to a new game id in the frontend if they want to rematch
  const room = getRoom(roomId);
  if (!room) return;

  //const gameData = await dbOperations.GetGameByShortCode(roomId);

  // Remove from game lookup (even disconnected players)
  const gamePlayers = await dbOperations.GetPlayersByShortCode(roomId);
  gamePlayers.forEach(async (player) => {
    await dbOperations.FinishedGameLookup(player);
  });

  // Mark game as finished depending on state
  // Disconnect all remaining players
  room.players.forEach(playerId => {
    const socket = getSocket(playerId)?.socket;
    if (socket) {
      socket.close();
    }
    removeSocket(playerId);
  });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const setupGameEvents = async (app: expressWs.Application) => {
  app.ws('/ws', (ws, req) => {
    console.log('Client connected');
    const token = req.header('Sec-WebSocket-Protocol') as string;
    const user = verifyAccessToken(token as string);
    if (!user) {
      ws.close();
      return;
    }
    else {
      addSocket(user.userId, ws)
    }
    // Handle incoming messages

    ws.on('message', async (message) => {
      try {
        console.log('Received message:', message);
        const data: ServerMessage = JSON.parse(message.toString());
        console.log('Parsed message:', data);

/////////////////////////////////////////////////////////////////////////////
        switch (data.event) {
          case 'joinGame': {
            
            const { roomId } = data.data as JoinGame["data"]; // follow datatype of JoinGame
            const userId = getUser(ws)?.userID;

            console.log('Join Game:', roomId, userId);

            if (!roomId || !userId) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
              return;
            }

            // Check if the user is already in the room
            if (playerInRoom(roomId, userId)) {
              reconnect(roomId, userId);
              // The user is already in the room
              ws.send(JSON.stringify({ event: 'error', data: { message: 'User is already in the room' } }));
              return; // TODO: Allow the user to reconnect to the room from another location
            }

            // Check if the current room is ongoing in database - if not then close websocket and instead use old game viewer
            let game;

            try {
              game = await dbOperations.GetGameByShortCode(roomId);
              if (game.state !== StandardGameStates.scheduled) {
                throw new Error('Game is not in appropriate state');
              }
              // else let the user spectate the game
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

            ///////////////////// IMPORTANT ////////////////////////
            // Check the user is one of the two players in the game
            // If not then enter spectating mode, for now return

            switch (gamemode?.name) {

              case 'standard': {

                // Check if the user is one of the players in the game
                const gameLookup = await dbOperations.GetGameByPlayerLookup(userId);
                const game = await dbOperations.GetGameByShortCode(roomId);

                if (!gameLookup || gameLookup !== game.id) {
                  // If not then enter spectating mode, for now return
                  ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid game lookup' } }));
                  return;
                }

                // All checks have passed, the player may be added to the game

                break;
              }

              case 'friendly': {

                // Check that the user is free to join the room
                try {

                  // REWRITE THE BELOW
                    // Check if the user is already in a game
                    // If not add them to gamelookup if they are not already in it
                  const gameLookup = await dbOperations.GetGameByPlayerLookup(userId);
                  const gamePlayers = await dbOperations.GetPlayersByShortCode(roomId);
                  // Check that the room has room for another player
                  if (gamePlayers.length >= 2)
                    // allow spectation
                    throw new Error('Room is full');

                  if (gameLookup) {
                    if (gameLookup !== game.id) {
                      console.log("Found game by player:", userId, gameLookup);
                      const theirGame = await dbOperations.GetGameByID(gameLookup);
                      ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid game lookup', redirect: `/game?room=${theirGame.short_id}` } } as Error));
                      return;
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
                await setupPlayer(userId, gamemode!);
                
                joinRoom(roomId, userId);
                
                ws.send(JSON.stringify({
                  event: 'playerJoined',
                  data: { 
                    gameInfo: room.gameInfo }
                  } as PlayerJoined)); // Use the types for type checking
                  
                  // standard friendly gamemode starts with 2 players (current socket added above)
                if (room.players.length === 2) {
                  const p1Time: number = time_control!.base_time*60000;
                  const p2Time: number = p1Time + time_control!.disadvantage*1000; 
                  room.players.forEach((player, index) => {
                    getSocket(player)!.socket.send(JSON.stringify({
                    event: "gameStart",
                    data: {
                      playerNumber: index,
                      players: [
                        { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
                        { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
                        ]
                      }
                    } as GameStart));
                  });

                  // Assign the game to the players (for friendly game no elo change)
                  room.players.forEach((player, num) => {
                    assignGame(game.id, player, num);
                  });
                }
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
            const user = getUser(ws)?.userID || '';

            if (!room || !user || !playerInRoom(roomId, user)) {
              // fix this to re-create the room by getting the user to refresh their page
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data on backend' } }));
              return;
            }

            // The player and room have been fully verified

            const userId = getUser(ws)?.userID;
            const gamemode = getGameMode(roomId);

            let verification: verificationData;

            switch (gamemode?.name) {
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

            if (verification.turn === -1) {
              return;
            }
            
            // I think that happens by default
            if (verification.turn === 1) {
              sendToRoom(roomId, {
                event: 'startTimer',
              } as StartTimer);
            }

            if (verification.draw || verification.winner) {
              // sendToRoom(roomId, {
              //   event: "endGame",
              //   data: { winner: verification.winner, draw: verification.draw });
            }

            sendToRoom(roomId, {
              event: 'moveMade',
              data: { 
                nextPlayer: verification.nextPlayer, 
                col: col,
                timeLeft: verification.timeLeft
               }
              } as MoveMade)
          
            try {
              // consider speed, will this write to the database in time for the next move??
              const gameId = (await dbOperations.GetGameByShortCode(roomId))?.id;
              dbOperations.MakeMove(gameId, userId, verification.turn, col, verification.delta);
            }
            catch (error) {
              throw new Error('Failed to send move to database');
            }
            break;

          }

          //case 'sendMessage': { } // TODO: allow chatting, not a priority, messages are not stored, use profanity filter

          //case 'timedOut': { } // TODO: handle timeouts

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

    ws.on('close', () => {
      // gracefully handle disconnections as player may reconnect
      const userId = getUser(ws)?.userID;
      console.log('Client disconnected:', userId);

      if (userId) {
        removeSocket(userId);
      }

      // check if the user was in a game - if so then send a message to the other player
      // TODO: if the other player is not connected then idfk
      const roomId = getRoomOfPlayer(userId)
      const room = getRoom(roomId!)!;
      if (roomId) {
        sendToRoom(roomId, {
          event: 'playerDisconnected',
          data: {
            playersCount: room.players.length
          }
        } as PlayerDisconnected);
    
        // the player has some time to return if there are other players so do nothing
        if (room.players.length === 1) {
          handleGameEnd(roomId, 'abandoned'); // IMPORTANT - TODO: handle this
        }
      }
      
      // The player will get timed out if they don't reconnect in time and the room will be deleted there
    });
  });
};