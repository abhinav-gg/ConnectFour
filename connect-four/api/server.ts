import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupGameEvents } from './events/gameEvents';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

setupGameEvents(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});