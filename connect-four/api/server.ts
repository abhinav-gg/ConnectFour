import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupGameEvents } from './events/gameEvents';

// Express + Socket.IO setup
const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinGame', (roomId) => {
    console.log(`Client ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

setupGameEvents(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});