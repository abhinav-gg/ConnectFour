// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbOperations } from '../db/operations.js';
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from '../lib/auth/index.js';
import { authenticateJWT } from '../lib/auth/middleware';
import { create } from 'domain';

const router = Router();

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
    console.log(error);
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
  console.log('Login:', username, password);
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

    const user = await dbOperations.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

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
  console.log('User ID:', userId);
  try {
    const user = await dbOperations.getUserByID(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ username: user.username, created_at: user.created_at });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    next(error);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
});

router.post('/logout', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  // If the user is authenticated, proceed to clear the refresh token cookie
  res.clearCookie('refreshToken'); // Clear the refresh token cookie
  res.json({ status: 'Success' }); // Return success response
});

export default router;