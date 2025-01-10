// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbOperations } from '../db/operations.js';
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from '../lib/auth/index.js';
import { authenticateJWT } from '../lib/auth/middleware';

const router = Router();

/*app.post('/api/test-db/register', async (req: express.Request, res: any) => {
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
});*/

// Registration Route
router.post('/register', async (req: Request, res: any) => {
  const { username, email, password } = req.body;

  const schema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]*$/),
    email: z.string().email(),
    password: z.string().min(8).max(1024),
  });

  try {
    schema.parse({ username, email, password });
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const result = await dbOperations.createUser(username, email, passwordHash);
    return res.json({ status: 'Success', data: result });
  } catch (error) {
    console.error('Failed to create user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login Route
router.post('/login', async (req: Request, res: any) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    return res.status(400).json({ error: 'Username or email is required' });
  } else if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const schema = z.object({
    username: z.string().max(30).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(1024),
  });

  try {
    let fetchedHash: string | null = null;
    if (username) {
      fetchedHash = await dbOperations.getPasswordHashByUsername(username);
    } else if (email) {
      fetchedHash = await dbOperations.getPasswordHashByEmail(email);
    }

    if (!fetchedHash) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await verifyPassword(fetchedHash, password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const userID = username ? await dbOperations.getIDByUsername(username) : await dbOperations.getIDByEmail(email);
    if (!userID) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(userID);
    const refreshToken = generateRefreshToken(userID);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return res.json({ status: 'Success', data: { accessToken } });
  } catch (error) {
    console.error('Failed to login:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// Profile Route
router.get('/profile', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await dbOperations.getUserByID(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ username: user.username });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    next(error);
  }
});

export default router;