// src/controllers/socket/index.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { registerSocketHandler } from './handlers';
import { redisOps } from '@/redis/ops'

let io: Server | null = null;

export function setupSocketIO(server: HttpServer) {
  if (io) return io; // Return existing instance if already initialized

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);

    const sessionId = socket.handshake.auth.sessionId; // or from a JWT, query param, etc.
    
    registerSocketHandler.game(socket);
    registerSocketHandler.matchmaking(socket);
    // Add more socket handlers here...

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) throw new Error("Socket.IO has not been initialized.");
  return io;
}
