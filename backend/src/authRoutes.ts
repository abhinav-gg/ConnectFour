// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbOperations } from '@/db/operations';
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from '@/lib/auth/index';
import { authenticateAdmin, authenticateJWT } from '@/lib/auth/middleware';
import * as dbErrors from '@/db/dbErrors';

const authRouter = Router();

// Registration Route
authRouter.post('/register', async (req: Request, res: any) => {
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
authRouter.post('/login', async (req: Request, res: any) => {
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
      return res.status(404).json({ message: 'User not found' });
    }
    else {
      const passwordMatch = await verifyPassword(fetchedHash, password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
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

authRouter.get('/anonymous', async (req: Request, res: Response) => {
  // Create a new user called Anonymous
  // Add security to prevent multiple anonymous users by bots
  console.log("Creating anonymous user")
  try {
    const user = await dbOperations.getAnonymousUser();
    console.log(user)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    res.json({ status: 'Success', data: { accessToken } });
  } catch (error) {
    console.error('Failed to login:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Profile Route
authRouter.get('/profile', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  console.log('User ID:', userId);
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


authRouter.get('/protected-route', authenticateJWT, (req: any, res: Response) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

authRouter.post('/refresh', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies?.refreshToken; // Get the refresh token from cookies

  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token not found' });
  }

  try {
    // Verify the refresh token
    // Assuming req.user.id is available through the authenticateJWT middleware
    const accessToken = generateAccessToken((req as any).user.id);

    res.json({ accessToken });
  } catch (error) {
    console.error('Failed to refresh token:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  // If the user is authenticated, proceed to clear the refresh token cookie
  res.clearCookie('refreshToken'); // Clear the refresh token cookie
  res.json({ status: 'Success' }); // Return success response
});

authRouter.get('/isadmin', authenticateJWT, authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  res.json({ isAdmin: true });
});

authRouter.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Test endpoint' });
});

export default authRouter;