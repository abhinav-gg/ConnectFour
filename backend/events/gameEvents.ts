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
        socket.emit('roomFull', { message: 'This game is full' });
        return;
      }

      socket.join(roomId);
      room.players.push(socket.id);
      state.rooms.set(roomId, room);

      io.to(roomId).emit('playerJoined', {
        playersCount: room.players.length,
        playerNumber: room.players.length
      });

      if (room.players.length === 2) {
        io.to(roomId).emit('gameStart', { 
          firstPlayer: room.players[0],
          players: room.players
        });
      }
    });

    socket.on('makeMove', ({ roomId, col }: { roomId: string, col: number }) => {
      const room = state.rooms.get(roomId);
      if (!room) return;

      const playerIndex = room.players.indexOf(socket.id);
      const currentPlayer = playerIndex + 1;

      if (playerIndex === -1 || currentPlayer !== (room.currentTurn + 1)) {
        socket.emit('error', { 
          message: 'Not your turn',
          currentTurn: room.currentTurn + 1,
          yourPlayer: currentPlayer
        });
        return;
      }

      io.to(roomId).emit('moveMade', { 
        col, 
        player: currentPlayer,
        timestamp: new Date().toISOString()
      });
      
      room.currentTurn = room.currentTurn === 0 ? 1 : 0;
      state.rooms.set(roomId, room);
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of state.rooms.entries()) {
        const playerIndex = room.players.indexOf(socket.id);
        if (playerIndex !== -1) {
          room.players = room.players.filter(id => id !== socket.id);
          
          if (room.players.length === 0) {
            state.rooms.delete(roomId);
          } else {
            io.to(roomId).emit('playerDisconnected', {
              message: 'Other player disconnected',
              playersCount: room.players.length
            });
          }
        }
      }
    });
  });
};