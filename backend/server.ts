import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { dbOperations } from './db/operations.js';
import { setupGameEvents } from './events/gameEvents';
import { UserRoutes } from './auth/userRoutes';
import { AuthService } from './auth/services/authService';
import { UserService } from './auth/services/userService';


dotenv.config();

const port = process.env.PORT || 3001;
const { app } = expressWs(express());

console.log('Attempting to use port:', port);
console.log('Environment port:', process.env.port);

app.get('/', (req, res) => {
  res.send(`Backend is running on port ${port}!`);
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

app.head('/health', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/test-db', async (req: express.Request, res: any) => {
  const { username } = req.body as { username: string; };

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const result = await dbOperations.createUser(username);
    return res.json({ status: 'Success', data: result });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return res.status(500).json({
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

setupGameEvents(app);

const authService = new AuthService();
const userService = new UserService();
const userRoutes = new UserRoutes(authService, userService);
app.use('/auth', userRoutes.getRouter());

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});