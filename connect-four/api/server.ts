import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupGameEvents } from './events/gameEvents';
import dotenv from 'dotenv';
import { dbOperations } from './db/operations';

// Load environment variables
dotenv.config();

// Express + Socket.IO setup
const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Backend is running!')
})

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

const httpServer = createServer(app);

app.head('/health', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/test-db', async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const result = await dbOperations.createUser(username);
        res.json({ status: 'Success', data: result });
    } catch (error: any) {
        console.error('Failed to create user:', error);
        res.status(500).json({ 
            error: 'Failed to create user',
            details: {
                message: error.message,
                type: error.constructor.name
            }
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await dbOperations.getAllUsers();
        res.json({ status: 'Success', data: users });
    } catch (error: any) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: {
                message: error.message,
                type: error.constructor.name
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