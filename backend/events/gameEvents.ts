import { type UUID } from "crypto";
import expressWs from "express-ws";
import type { WebSocket as WSocket } from "ws";
import { Message, Room } from "../types";

interface GameState {
  rooms: Map<string, Room>;
}

const state: GameState = {
  rooms: new Map()
};

const SocketIDs = new Map<UUID, WSocket>();

function sendToRoom(roomId: string, event: string, data: any) {
  const room = state.rooms.get(roomId);
  if (!room) return;

  const wsData = JSON.stringify({ event, data });

  for (const playerId of room.players) {
    const socket = SocketIDs.get(playerId);
    if (socket) {
      socket.send(wsData);
    }
  }
}

export const setupGameEvents = (app: expressWs.Application) => {
  app.ws('/ws', (ws, req) => {
    const socket = ws as WSocket;
    // const id: UUID = randomUUID();
    SocketIDs.set(id, socket);

    ws.on('message', (message) => {
      const data: Message = JSON.parse(message.toString());
      console.log('Received message:', data);

      switch (data.event) {
        case 'joinGame': {
          const roomId = data.data.roomId;
          const room = state.rooms.get(roomId) || { players: [] };

          if (room.players.length >= 2) {
            ws.send(JSON.stringify({ event: 'roomFull', data: { message: 'This game is full' } }));
            return;
          }

          room.players.push(id);
          state.rooms.set(roomId, room);

          sendToRoom(roomId, 'playerJoined', {
            playersCount: room.players.length,
            playerNumber: room.players.length
          });

          if (room.players.length === 2) {
            sendToRoom(roomId, 'gameStart', {
              firstPlayer: room.players[0],
              players: room.players
            });
          }
          break;
        }

        case 'makeMove': {
          const { roomId, col } = data.data;
          const room = state.rooms.get(roomId);
          if (!room) return;

          const playerIndex = room.players.indexOf(id);
          const currentPlayer = playerIndex + 1;

          if (playerIndex === -1 || currentPlayer !== (room.currentTurn + 1)) {
            ws.send(JSON.stringify({
              event: 'error',
              data: {
                message: 'Not your turn',
                currentTurn: room.currentTurn + 1,
                yourPlayer: currentPlayer
              }
            }));
            return;
          }

          sendToRoom(roomId, 'moveMade', {
            col,
            player: currentPlayer,
            timestamp: new Date().toISOString()
          });

          room.currentTurn = room.currentTurn === 0 ? 1 : 0;
          state.rooms.set(roomId, room);
          break;
        }

        default:
          console.log('Unknown event:', JSON.stringify(data));
          break;
      }
    });

    ws.on('disconnect', () => {
      console.log('Client disconnected:', id);
      SocketIDs.delete(id);

      for (const [roomId, room] of state.rooms.entries()) {
        const playerIndex = room.players.indexOf(id);
        if (playerIndex !== -1) {
          room.players = room.players.filter(id => id !== id);

          if (room.players.length === 0) {
            state.rooms.delete(roomId);
          } else {
            sendToRoom(roomId, 'playerDisconnected', {
              message: 'Other player disconnected',
              playersCount: room.players.length
            });
          }
        }
      }
    });
  });
};