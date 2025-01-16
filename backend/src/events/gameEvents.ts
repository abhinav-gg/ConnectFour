import expressWs from "express-ws";
import type { WebSocket as WSocket } from "ws";
import type { Room, RoomMap } from "../types/types";
import type { GameStart, JoinGame, MakeMove, Message } from "@shared/Types/websocketData";
import { dbOperations } from "@/db/operations";
import { verifyAccessToken } from "@/lib/auth";
import { UUID } from "crypto";
import { GameInfo, GameMode, TimeControl } from "@shared/Models/gameInfo";
import { StandardGameStates } from "@shared/constants";
import { assert } from "console";
import { GameState } from "@shared/utils/game";

const state : RoomMap = {
  rooms: new Map<string, Room>()
};

type UserCachedSocket = {
  userID: string;
  username: string;
  socket: WSocket;
}

const SocketIDs = [] as UserCachedSocket[];


function getRoom(room: string) {
  return state.rooms.get(room);
}

function playerInRoom(room: string, player: string) {
  return getRoom(room)?.players.includes(player as UUID);
}

function getSocket(userID: string) {
  return SocketIDs.find(s => s.userID === userID);
}

function getUser(socket: WSocket): UserCachedSocket {
  return SocketIDs.find(s => s.socket === socket)!;
}

function addSocket(userID: string, username: string, socket: WSocket) {
  SocketIDs.push({ userID, username, socket });
}

function addGameInfo(roomid: string, gameInfo: GameInfo) {
  const room = getRoom(roomid);
  if (room) {
    room.gameInfo = gameInfo;
  } else {
    throw new Error(`Room with id ${roomid} not found`);
  }
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

function makeRoom(roomid: string, player: string, gamemode: GameMode, time_control: TimeControl) {
  state.rooms.set(roomid, {
    players: [player as UUID],
    gameInfo: { gamemode, time_control },
    currentTurn: 0
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

function sendToRoom(roomId: string, event: string, data: any) {
  const room = getRoom(roomId);
  if (!room) return;

  const wsData = JSON.stringify({ event, data });

  room.players.forEach(playerId => {
    const socket = getSocket(playerId)?.socket;
    if (socket) {
      socket.send(wsData);
    }
  });
};

/////////////////////////////////////////////////////////////

type verificationData = {
  delta: number;
  turn: number;
  nextPlayer: string;
  draw: boolean;
  winner: string | null;
}

async function verifyStandardGame(roomId: string, userId: string, col: number): Promise<verificationData> {
  const moves = await dbOperations.GetMovesByGameID(roomId);
  const timecontrol = getTimeControl(roomId)!;
  const room = getRoom(roomId)!;
  
  // Verify the correct player is sending the move
  if (room.currentTurn !== room.players.indexOf(userId as UUID)) {
    return {
      delta: 0,
      turn: -1,
      nextPlayer: room.players[room.currentTurn],
      draw: false,
      winner: null
    } as verificationData;
  }
  
  // Verify the time left here and calculate the time delta
  let timeTaken = 0; // calculate time taken

  if (moves.length == 0) {
    return {
      delta: 0,
      turn: 1,
      nextPlayer: userId,
      draw: false,
      winner: null
    } as verificationData;
  }
  else {
    let allowedTime = 0; // get allowed time from time control
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].player === userId) {
        timeTaken += moves[i].delta;
      }
    }
    if (userId === room?.players[1]) {
      allowedTime += timecontrol?.disadvantage as number;
    }
    const movesMadeByPlayer = moves.filter(m => m.player === userId).length;
    allowedTime += timecontrol.base_time
                +  timecontrol.increment * movesMadeByPlayer;

    const lastMoveMadeTime = moves[moves.length - 1].played_at;
    const currentTime = new Date().getTime();
    if (timeTaken > allowedTime){
      return {
        delta: lastMoveMadeTime - currentTime,
        turn: -1,
        nextPlayer: "",
        draw: false,
        winner: room?.players[room.players.indexOf(userId as UUID) === 0 ? 1 : 0]
      } as verificationData;
    }
  }


  // Verify game here, leave for now assuming no interference occured
  const intMoves = moves.map(m => { return m.col }) as number[]
  const gameState = new GameState();
  intMoves.forEach((col) => {
    let res = gameState.makeMove(col, true);
    if (!res.success)
      throw new Error('Invalid move');
  });
  if (gameState.gameOver) {
    return {
      delta: 0,
      turn: -1,
      nextPlayer: "",
      draw: false,
      winner: room?.players[gameState.winner as number]
    } as verificationData;
  }
  else {
    return {
      delta: 0,
      turn: 1,
      nextPlayer: userId,
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

  const gameData = await dbOperations.GetGameByShortCode(roomId);

  // Remove from game lookup
  // Mark game as finished depending on state

  room.players.forEach(playerId => {
    const socket = getSocket(playerId)?.socket;
    if (socket) {
      socket.close();
    }
    removeSocket(playerId);
  });
};

export const setupGameEvents = async (app: expressWs.Application) => {
  app.ws('/ws', async (ws, req) => {
    console.log('Client connected');

    const token = req.header('Sec-WebSocket-Protocol') as string;
    console.log(req.params);
    // Extract the Sec-WebSocket-Protocol header token from the request
    const user = verifyAccessToken(token as string);

    if (user) {
      console.log('User connected:', user);
      const userobj = await dbOperations.getUserByID(user.userID)
      console.log(userobj);
      if (!userobj) {
        console.log('User not found');
        ws.close();
        return;
      }
      const username = userobj.username || 'Anonymous';
      addSocket(user.userID, username, ws);
    } else {
      console.log('User not authenticated');
      ws.close();
      return;
    }

    ws.on('message', async (message) => {
      try {
        const data: Message = JSON.parse(message.toString());
        console.log('Received message:', data);

        switch (data.event) {
          case 'joinGame': {
            
            const { roomId } = data.data as JoinGame["data"]; // follow datatype of JoinGame
            const userId = getUser(ws)?.userID;
            if (!roomId || !userId) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
              return;
            }

            if (playerInRoom(roomId, userId)) {
              // The user is already in the room
              ws.send(JSON.stringify({ event: 'error', data: { message: 'User is already in the room' } }));
              return; // TODO: Allow the user to reconnect to the room from another location
            }

            // Check if the room is ongoing in database - if not then close websocket and instead use old game viewer

            try {
              const game = await dbOperations.GetGameByShortCode(roomId);
              const status = await dbOperations.GetGameStatusById(game.id);
              if (status !== StandardGameStates.ongoing
               || status !== StandardGameStates.scheduled) {
                throw new Error('Game is not ongoing');
              }
            }
            catch (error) {
              console.error('Failed to check if game is ongoing:', error);
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Failed to check if game is ongoing' } }));
              return;
            }

            // Check if the user is already in the room
            let gamemode = getGameMode(roomId);
            let time_control = getTimeControl(roomId);
            const roomExists = state.rooms.has(roomId);
            if (!roomExists) {
              assert (gamemode, 'Game info is defined by the first player in a room');
              gamemode = await dbOperations.GetGameModeFromShortCode(roomId);
              time_control = await dbOperations.GetTimeControlFromShortCode(roomId);
              makeRoom(roomId, userId, gamemode, time_control);
            }

            ///////////////////// IMPORTANT ////////////////////////
            // Check the user is one of the two players in the game
            // If not then enter spectating mode, for now return

            switch (gamemode?.name) {

              case 'standard': {

                // Check if the user is one of the players in the game
                const gameLookup = await dbOperations.GetGameLookupByPlayer(userId);
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
                  const gameLookup = await dbOperations.GetGameLookupByPlayer(userId);
                  if (gameLookup)
                    throw new Error('User is already in a game');
                }
                catch (error) {
                  console.error('Failed to check if user is free to join room:', error);
                  ws.send(JSON.stringify({ event: 'error', data: { message: 'Failed to check if user is free to join room' } }));
                  return;
                }

                const roomFull = getRoom(roomId)?.players.length === 2;
                // standard friendly gamemode starts with 2 players (current socket added above)
                
                if (roomFull) { 
                  // TODO: allow spectating
                  ws.send(JSON.stringify({ event: 'error', data: { message: 'Room is full' } }));
                  return;
                } else {

                  joinRoom(roomId, userId);
                  // add player to room
                  if (getRoom(roomId)?.players.length === 2) {
                    sendToRoom(roomId, 'gameStart', {
                      event: 'gameStart',
                      data : {
                        opponents: getRoom(roomId)?.players.filter(p => p !== userId)
                      }
                    } as GameStart);
                  }
                }
                break;
              }
              
              default : {
                // The game mode does not exist??
                throw new Error('Game mode does not exist');
              }
            }
            
            // Player is connecting to the game for the first time.
            // Send the game state to the player and update the room state

            
            sendToRoom(roomId, 'playerJoined', {
              event: 'playerJoined',
            });

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
            if (!roomId || !col) {
              ws.send(JSON.stringify({ event: 'error', data: { error: 'Invalid data by frontend' } }));
              return;
            }
            const room = state.rooms.get(roomId);
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
            
            if (verification.turn === 1) {
              sendToRoom(roomId, 'startTimer', { username: verification.nextPlayer });
            }

            if (verification.draw || verification.winner) {
              sendToRoom(roomId, 'endGame', { winner: verification.winner, draw: verification.draw });
            }

            sendToRoom(roomId, 'moveMade', { player: 
              room?.players.indexOf(user as UUID), col })
          
            try {
              // consider speed, will this write to the database in time for the next move??
              const dbResponse = await dbOperations.MakeMove(roomId, userId, verification.turn, col, verification.delta);
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
        ws.send(JSON.stringify({ event: 'error', data: { message: 'An error occurred' } }));
      }
    });

    ws.on('error', (error) => {
        console.error('Websocket error:', error);
    });

    ws.on('close', () => {

      // verify that one player isn't connected
      // if both players leave, the game should be marked as a draw

      const sid = getUser(ws)?.userID;
      console.log('Client disconnected:', sid);

      if (sid) {
        removeSocket(sid);
      }

      // check if the user was in a game - if so then send a message to the other player
      // TODO: if the other player is not connected then idfk
      state.rooms.forEach((room, roomId) => {
        if (room.players.includes(sid as UUID)) {
          sendToRoom(roomId, 'playerDisconnected', {
            playersCount: room.players.length
          });

          // the player has some time to return if there are other players so do nothing
          if (room.players.length === 1) {
            handleGameEnd(roomId, 'abandoned'); // TODO: handle this
          }
          
        }
      });
      // The player will get timed out if they don't reconnect in time and the room will be deleted there
    });
  });
};