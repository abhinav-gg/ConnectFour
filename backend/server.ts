import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import { dbOperations } from './db/operations.js';
import { setupGameEvents } from './events/gameEvents';
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from './lib/auth/index.js';
import { z } from 'zod';

import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from './lib/auth/index.js';
import { z } from 'zod';


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

app.post('/api/test-db/register', async (req: express.Request, res: any) => {
  const { username, email, password } = req.body as { username: string; email: string; password: string; };

  const schema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]*$/),
    email: z.string().email(),
    password: z.string().min(8).max(1024)
  });

  try {
    schema.parse({ username, email, password });
  } catch (error: any) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const result = await dbOperations.createUser(username, email, passwordHash);
    const passwordHash = await hashPassword(password);
    const result = await dbOperations.createUser(username, email, passwordHash);
    return res.json({ status: 'Success', data: result });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return res.status(500).json({
      error: 'Failed to create user',
    });
  }
});

app.post('/api/test-db/login', async (req: express.Request, res: any) => {
  const { username, email, password } = req.body as { username: string | null; email: string | null; password: string; };
  if (!username && !email) {
    return res.status(400).json({ error: 'Username or email is required' });
  } else if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const schema = z.object({
    username: z.string().max(30).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(1024)
  });

  try {
    let fetchedHash: string | null = null;
    if (username) {
      fetchedHash = await dbOperations.getPasswordHashByUsername(username);
    } else if (email) {
      fetchedHash = await dbOperations.getPasswordHashByEmail(email);
    }

    const hash = fetchedHash;

    if (!hash) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await verifyPassword(hash, password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    let fetchedID: string | null = null;
    if (username) {
      fetchedID = await dbOperations.getIDByUsername(username);
    } else if (email) {
      fetchedID = await dbOperations.getIDByEmail(email);
    }

    const userID = fetchedID;
    if (!userID) {
      return res.status(404).json({ error: 'User not found' });
    }

    dbOperations.recordUserLogin(userID);

    const accessToken = generateAccessToken(userID);
    const refreshToken = generateRefreshToken(userID);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    return res.json({ status: 'Success', data: { accessToken } });
  } catch (error: any) {
    console.error('Failed to login:', error);
    return res.status(500).json({
      error: 'Failed to login',
    });
  }
});

app.post('/api/openings', async (req, res) => {
  const { position } = req.body;
  console.log('Position:', position);
  try {
    const openings = await dbOperations.GetOpening(position.toString());
    res.json({ status: 'Success', data: openings });
  } catch (error: any) {
    console.error('Failed to fetch openings:', error);
    res.status(500).json({
      error: 'Failed to fetch openings'
    });
  }
});

app.get('/api/allopenings', async (req, res) => {
  try {
    const openings = await dbOperations.getAllOpenings1();
    res.json({ status: 'Success', data: openings });
  } catch (error: any) {
    console.error('Failed to fetch openings:', error);
    res.status(500).json({
      error: 'Failed to fetch openings'
    });
  }
});


app.get('/api/test-db/users', async (req, res) => {
  try {
    const users = await dbOperations.__getAllUsers();
    res.json({ status: 'Success', data: users });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

setupGameEvents(app);



app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});