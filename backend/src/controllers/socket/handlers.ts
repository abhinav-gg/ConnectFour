import { Socket } from 'socket.io';
import { registerMatchmakingHandlers } from './routes/matchmaking';
import { registerGameHandlers } from './routes/gameEvents';

// Main connection handler
export const registerSocketHandler = {
  game: registerGameHandlers,
  matchmaking: registerMatchmakingHandlers,
}

// Disconnect handler
export function handleDisconnect(socket: Socket) {
  // Clean up user state, remove from rooms, etc.
  console.log(`Cleaning up user ${socket.id}`);
  
  // Leave all rooms
  socket.rooms.forEach(room => {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`User ${socket.id} left room ${room}`);
    }
  });
}

export function withNamespace(socket: Socket, prefix: string): Socket {
  return new Proxy(socket, {
    get(target, prop, receiver) {
      if (prop === 'on') {
        return (event: string, listener: (...args: any[]) => void) =>
          target.on(`${prefix}/${event}`, listener);
      }
      if (prop === 'emit') {
        return (event: string, ...args: any[]) =>
          target.emit(`${prefix}/${event}`, ...args);
      }

      const value = Reflect.get(target, prop, receiver);
      // If it's a function, bind it to target to preserve 'this'
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  }) as Socket;
}