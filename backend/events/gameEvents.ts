// import { type UUID } from "crypto";
// import expressWs from "express-ws";
// import type { WebSocket as WSocket } from "ws";
// import type { Room, GameState } from "../types/types";
// import type { Message } from "@shared/Types/websocketData";
// import { dbOperations } from "@/db/operations";

// const state: GameState = {
//   rooms: new Map()
// };

// const SocketIDs = new Map<UUID, WSocket>();
// const IDToSocket = new Map<WSocket, UUID>()

// function sendToRoom(roomId: string, event: string, data: any) {
//   const room = state.rooms.get(roomId);
//   if (!room) return;

//   const wsData = JSON.stringify({ event, data });

//   [room.player1, room.player2].forEach(playerId => {
//     const socket = SocketIDs.get(playerId);
//     if (socket) {
//       socket.send(wsData);
//     }
//   });
// };

// function handleGameEnd(roomId: string) {
//   // Simply close the websocket for this game because the room can never be reused
//   // players will be redirected to a new game id in the frontend if they want to rematch
//   const room = state.rooms.get(roomId);
//   if (!room) return;

//   [room.player1, room.player2].forEach(playerId => {
//     const socket = SocketIDs.get(playerId);
//     if (socket) {
//       socket.close();
//     }
//     SocketIDs.delete(playerId);
//   });
// }

// export const setupGameEvents = async (app: expressWs.Application) => {
//   app.ws('/ws', async (ws, req) => {
//     console.log('Client connected');

//     ws.on('message', async (message) => {
//       try {
//         const data: Message = JSON.parse(message.toString());
//         console.log('Received message:', data);

//         switch (data.event) {
//           case 'joinGame': {
            
//             // a player might be rejoining the room so deal with that here
//             // check who's turn it is with the database and update the game state
            
//             const roomId = data.data.roomId;
//             const userId = data.data.userId;
//             if (!roomId || !userId) {
//               ws.send(JSON.stringify({ event: 'error', data: { message: 'Invalid data' } }));
//               return;
//             }

//             // Check about the room status
//             const roomData = await dbOperations.getRoomById(roomId);

//             if (!roomData) {
//               ws.send(JSON.stringify({ event: 'error', data: { message: 'Room not found' } }));
//               return;
//             }

//             SocketIDs.set(userId, ws); // TODO allow for multiple sockets per user (?)

//             const roomExists = state.rooms.has(roomId);
//             const room = state.rooms.get(roomId) || { players: [], currentTurn: 0 };
//             if (!roomExists) {
//               state.rooms.set(roomId, room);
//             }

//             if (room.players.length >= 2) {
//               ws.send(JSON.stringify({ event: 'roomFull', data: { message: 'This game is full' } }));
//               return;
//             }
//             room.players.push(userId);
//             state.rooms.set(roomId, room); // update room

//             sendToRoom(roomId, 'playerJoined', {
//               playersCount: room.players.length,
//               playerNumber: room.players.length
//             });

//             if (room.players.length === 2) {
//               sendToRoom(roomId, 'gameStart', {
//                 firstPlayer: room.players[0],
//                 players: room.players
//               });
//             }
//             break;
//           }

//           case 'makeMove': {

//             // fetch all moves from db for validation of move
//             // check it is the correct player's turn
//             // insert the move in the database and send the move to the other player



//             const { roomId, col } = data.data;
//             const room = state.rooms.get(roomId);

//             if (!room) return; 
//             const id = IDToSocket.get(ws);
//             if (!id) return;
//             // TODO: handle error for invalid room

//             const playerIndex = room.players.indexOf(id);
//             const currentPlayer = playerIndex + 1;

//             if (playerIndex === -1 || currentPlayer !== (room.currentTurn + 1)) {
//               ws.send(JSON.stringify({
//                 event: 'error',
//                 data: {
//                   message: 'Not your turn',
//                   currentTurn: room.currentTurn + 1,
//                   yourPlayer: currentPlayer
//                 }
//               }));
//               return;
//             }

//             sendToRoom(roomId, 'moveMade', {
//               col,
//               player: currentPlayer,
//               timestamp: new Date().toISOString()
//             });

//             room.currentTurn = room.currentTurn === 0 ? 1 : 0;
//             state.rooms.set(roomId, room);
//             break;
//           }

//           case 'endGame': {
//             const { roomId } = data.data;
//             handleGameEnd(roomId);
//             break;
//           }

//           default:
//             console.log('Unknown event:', JSON.stringify(data));
//             break;
//         }
//       } catch (error) {
//         console.error('Error handling message:', error);
//         ws.send(JSON.stringify({ event: 'error', data: { message: 'An error occurred' } }));
//       }
//     });

//     ws.on('close', () => {

//       // verify that one player isn't connected
//       // if both players leave, the game should be marked as a draw

//       const sid = IDToSocket.get(ws);
//       console.log('Client disconnected:', sid);

//       if (sid) {
//         SocketIDs.delete(sid);

//         let room = state.rooms.get(sid);
//         room.players = room.players.filter(id => id !== sid);
//         state.rooms.delete(roomId);
//         sendToRoom(roomId, 'playerDisconnected', {
//           message: 'Other player disconnected',
//           playersCount: room.players.length
//         });
//       }
//     });
//   });
// };