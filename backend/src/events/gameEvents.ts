import expressWs from "express-ws";
import type { WebSocket as WSocket } from "ws";
import type { Room, GameState } from "../types/types";
import type { JoinGame, MakeMove, Message, MoveMade } from "@shared/Types/websocketData";
import { dbOperations } from "@/db/operations";
import { verifyAccessToken } from "@/lib/auth";
import { UUID } from "crypto";

const state: GameState = {
  rooms: new Map()
};

type UserSocket = {
  userID: string;
  socket: WSocket;
}

const SocketIDs = [] as UserSocket[];

function getSocket(userID: string) {
  return SocketIDs.find(s => s.userID === userID);
}

function getUserID(socket: WSocket) {
  return SocketIDs.find(s => s.socket === socket);
}

function addSocket(userID: string, socket: WSocket) {
  SocketIDs.push({ userID, socket });
}

function removeSocket(userID: string) {
  const index = SocketIDs.findIndex(s => s.userID === userID);
  if (index !== -1) {
    SocketIDs.splice(index, 1);
  }
}

function sendToRoom(roomId: string, event: string, data: any) {
  const room = state.rooms.get(roomId);
  if (!room) return;

  const wsData = JSON.stringify({ event, data });

  room.players.forEach(playerId => {
    const socket = getSocket(playerId)?.socket;
    if (socket) {
      socket.send(wsData);
    }
  });
};

async function handleGameEnd(roomId: string) {
  // Simply close the websocket for this game because the room can never be reused
  // players will be redirected to a new game id in the frontend if they want to rematch
  const room = state.rooms.get(roomId);
  if (!room) return;

  const gameData = await dbOperations.GetGameByShortCode(roomId);

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
    
    // Extract the Sec-WebSocket-Protocol header token from the request
    const user = verifyAccessToken(token as string);

    if (user) {
      console.log('User connected:', user);
      addSocket(user.userID, ws);
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
            const userId = getUserID(ws)?.userID;
            if (!roomId || !userId) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
              return;
            }
            const roomExists = state.rooms.has(roomId);
            if (!roomExists) {
              state.rooms.set(roomId, { players: [userId as UUID], currentTurn: 0 });
            }

            const gameInfo = dbOperations.GetGameByShortCode(roomId);

            switch (gameInfo.status) {

            const roomFull = state.rooms.get(roomId)?.players.length === 2; // change to accept large rooms
            // alternatively call database and check if game is ongoing
            
            if (roomFull) { // check room is full
              // TODO: allow user to reconnect from another location (new websocket connection)
              //       check who's turn it is with the database and update the game state
              const room = state.rooms.get(roomId);
            } else if (!roomExists) {
              // Wait for the second player to join
              
              // add player to room



              return;
            }

            ///////////////////// IMPORTANT ////////////////////////
            // Check the user is one of the two players in the game. <------
            // If not then enter spectating mode, for now return
            
            // Create a new room and game here:
            // if (!gameUsers.includes(userId)) {
            //   ws.send(JSON.stringify({ event: 'error', data: { message: 'Spectating coming soon!' } }));
            //   return;
            // }

            // Player is connecting to the game for the first time.
            // Send the game state to the player and update the room state

            // room.players.push(userId);
            // state.rooms.set(roomId, room); // update room

            // sendToRoom(roomId, 'playerJoined', {
            //   playersCount: room.players.length,
            //   playerNumber: room.players.length
            // });

            // if (room.players.length === 2) {
            //   sendToRoom(roomId, 'gameStart', {
            //     firstPlayer: room.players[0],
            //     players: room.players
            //   });
            // }
            break;
          }

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
            const user = getUserID(ws)?.userID || '';
            
            if (!room || !user) {
              // fix this to re-create the room by getting the user to refresh their page
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data on backend' } }));
              return;
            }

            const moves = await dbOperations.GetMovesByGameID(data.data.roomId);
            if (moves.length === 0)

            // Verify game here, leave for now assuming no interference occured

            // Verify the correct player is sending the move

            // Verify the time left here and calculate the time delta


            room.players.forEach(playerId => {
              const socket = getSocket(playerId)?.socket;
              if (socket) {
                socket.send(JSON.stringify({ event: 'moveMade', data: { player: 
                  room?.players.indexOf(user as UUID), col } 
                }));
              }
            });

            room.currentTurn = room.currentTurn + 1 % room.players.length;
            
            try {
              //const dbResponse = await dbOperations.MakeMove(roomId, col, 0);
            }
            catch (error) {
              console.error('Failed to send move to database:', error);
            }
            break;
          }

          case 'endGame': {


            // extremely important to verify the game has ended
            // extremely complicated to implement





            const { roomId } = data.data;
            handleGameEnd(roomId); // just handles closing the websocket, not DB updates

            // update the database to show the game has terminated
            const user = getUserID(ws);
            try {
              if (user && user.userID) {
                const stopLive = await dbOperations.FinishedGameLookup(user.userID);
              } else {
                console.error('User ID is undefined');
              }
            } catch (error) {
              console.error('Failed to update game lookup:', error);
            }

            // call game end api here for elo calculation and awarding

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

      const sid = getUserID(ws)?.userID;
      console.log('Client disconnected:', sid);

      if (sid) {
        removeSocket(sid);
      }

      // The player will get timed out if they don't reconnect in time and the room will be deleted there
    });
  });
};