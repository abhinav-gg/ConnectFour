import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupGameEvents } from './events/gameEvents';
import dotenv from 'dotenv';
import { testDatabase } from './db/operations';

// Load environment variables
dotenv.config();

// Express + Socket.IO setup
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

const httpServer = createServer(app);

app.post('/api/test-db', async (req, res) => {
  console.log('Received test-db request');
  
  try {
    console.log('Calling testDatabase function...');
    const result = await testDatabase();
    console.log('Database operation successful:', result);
    res.json({ status: 'Success', data: result });
    
  } catch (error: any) {
    console.error('Database operation failed');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      error: 'Database test failed',
      details: {
        message: error.message,
        type: error.constructor.name,
        // Add any other relevant error details
      }
    });
  }
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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