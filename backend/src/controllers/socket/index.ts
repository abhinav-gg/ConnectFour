// socket/io.ts
import { Server } from 'socket.io';
import { myConfig } from '@config/env'

let io: Server | null = null;

export function initSocketIO(server: any): Server {
  io = new Server(server, {
    cors: {
      origin: myConfig.CLIENT_URL,
      credentials: true,
    },
  });
  return io;
}

export function getSocketIO(): Server {
  if (!io) throw new Error('Socket.IO has not been initialized.');
  return io;
}
