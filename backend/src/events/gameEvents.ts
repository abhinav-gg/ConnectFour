import { type UUID } from "crypto";
import expressWs from "express-ws";
import type { WebSocket as WSocket } from "ws";
import type { Room, GameState } from "../types/types";
import type { MakeMove, Message, MoveMade } from "@shared/Types/websocketData";
import { dbOperations } from "@/db/operations";
import { verifyAccessToken } from "@/lib/auth";

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

  [room.player1, room.player2].forEach(playerId => {
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

  [room.player1, room.player2].forEach(playerId => {
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
            
            // TODO allow user to reconnect from another location (new websocket connection)
            //      check who's turn it is with the database and update the game state
            
            // Check the user is one of the two players in the game.
            
            // follow datatype of JoinGame
            const roomId = data.data.roomId;
            const userId = data.data.userId;
            if (!roomId || !userId) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
              return;
            }
            
            const roomExists = state.rooms.has(roomId);
            
            if (!roomExists) {
              const game = await dbOperations.GetGameByShortCode(roomId)
              console.log('Game:', game);
              if (!game) {
                ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid room' } }));
                return;
              }
            }
            const room = state.rooms.get(roomId) || { players: [], currentTurn: 0 };


            // if (room.players.length >= 2) {
            //   ws.send(JSON.stringify({ event: 'roomFull', data: { message: 'This game is full' } }));
            //   return;
            // }
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

            // fetch all moves from db for validation of move
            // check it is the correct player's turn
            // insert the move in the database and send the move to the other player

            // const moves = await dbOperations.GetMovesByGameID(data.data.roomId);

            // Verify game here, leave for now assuming no interference occured

            // read from MoveMade
            const { roomId, col } = data.data as MakeMove["data"];
            if (!roomId || !col) {
              ws.send(JSON.stringify({ event: 'error', data: { error: 'Invalid data' } }));
              return;
            }
            const room = state.rooms.get(roomId);
            //const index = data.room.currentTurn;


            // if (!room) return; 
            // const id = IDToSocket.get(ws);
            // if (!id) return;
            // // TODO: handle error for invalid room

            // const playerIndex = room.players.indexOf(id);
            // const currentPlayer = playerIndex + 1;

            // if (playerIndex === -1 || currentPlayer !== (room.currentTurn + 1)) {
            //   ws.send(JSON.stringify({
            //     event: 'error',
            //     data: {
            //       message: 'Not your turn',
            //       currentTurn: room.currentTurn + 1,
            //       yourPlayer: currentPlayer
            //     }
            //   }));
            //   return;
            // }

            // sendToRoom(roomId, 'moveMade', {
            //   col,
            //   player: currentPlayer,
            //   timestamp: new Date().toISOString()
            // });

            // room.currentTurn = room.currentTurn === 0 ? 1 : 0;
            // state.rooms.set(roomId, room);

            // const dbResponse = await dbOperations.MakeMove(roomId, col, 0);

            break;
          }

          case 'endGame': {
            const { roomId } = data.data;
            handleGameEnd(roomId);
            break;
          }

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

    // ws.on('close', () => {

    //   // verify that one player isn't connected
    //   // if both players leave, the game should be marked as a draw

    //   const sid = IDToSocket.get(ws);
    //   console.log('Client disconnected:', sid);

    //   if (sid) {
    //     SocketIDs.delete(sid);

    //     // let room = state.rooms.get(sid);
    //     // room.players = room.players.filter(id => id !== sid);
    //     // state.rooms.delete(roomId);
    //     // sendToRoom(roomId, 'playerDisconnected', {
    //     //   message: 'Other player disconnected',
    //     //   playersCount: room.players.length
    //     // });
    //   }
    // });
  });
};