import { Server, Socket } from 'socket.io';

interface GameState {
  rooms: Map<string, {
    players: string[];
    currentTurn: number;
  }>;
}

const state: GameState = {
  rooms: new Map()
};

export const setupGameEvents = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    
    socket.on('joinGame', (roomId: string) => {
      const room = state.rooms.get(roomId) || { players: [], currentTurn: 0 };
      
      if (room.players.length >= 2) {
        socket.emit('roomFull');
        return;
      }

      socket.join(roomId);
      room.players.push(socket.id);
      state.rooms.set(roomId, room);

      if (room.players.length === 2) {
        io.to(roomId).emit('gameStart', { firstPlayer: room.players[0] });
      }
    });

    socket.on('makeMove', ({ roomId, col }: { roomId: string, col: number }) => {
      const room = state.rooms.get(roomId);
      if (!room) return;

      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex === -1 || playerIndex !== room.currentTurn) return;

      // Relay move to other player
      socket.to(roomId).emit('moveMade', { col, player: playerIndex });
      
      // Update turn
      room.currentTurn = (room.currentTurn + 1) % 2;
      io.to(roomId).emit('turnChange', { currentPlayer: room.players[room.currentTurn] });
    });

    socket.on('disconnect', () => {
      // Clean up rooms when players disconnect
      for (const [roomId, room] of state.rooms.entries()) {
        if (room.players.includes(socket.id)) {
          socket.to(roomId).emit('playerDisconnected');
          state.rooms.delete(roomId);
        }
      }
    });
  });
};