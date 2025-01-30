// src/routes/authRoutes.ts
import { dbOperations } from '@/db/operations';
import { createSession, revokeSession, hashPassword, verifyPassword } from '@/lib/auth/index';
import { authenticateAdmin, authenticateSession, verifyRecaptcha } from '@/lib/auth/middleware';
import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const authRouter = Router();
const disallowedUsernames = new Set(fs.readFileSync(path.join('..', 'shared', 'reserved_usernames.txt'), 'utf-8').split('\n').map((line) => line.trim().toLowerCase()));

// Registration Route
authRouter.post('/register', verifyRecaptcha, async (req: Request, res: any) => {
  const { username, email, password } = req.body as { username: string, email: string, password: string; };
  const usernameNormalised = username.trim().toLowerCase();
  const emailNormalised = email.trim().toLowerCase();
  const passwordNormalised = password.trim();

  const schema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]*$/),
    email: z.string().email(),
    password: z.string().min(8).max(1024),
  });

  try {
    schema.parse({ username: usernameNormalised, email: emailNormalised, password: passwordNormalised });
  } catch (error) {
    // commented out as too verbose
    // console.log(error);
    return res.status(400).json({ error: 'Invalid input' });
  }

  // check against disallowed usernames
  if (disallowedUsernames.has(usernameNormalised)) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  try {
    const passwordHash = await hashPassword(passwordNormalised);
    const result = await dbOperations.createUser(usernameNormalised, emailNormalised, passwordHash);
    const sessionToken = await createSession(result.id);

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

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

    const sessionToken = await createSession(user.id);

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
    });

    res.json({ status: 'Success' });
  } catch (error) {
    console.error('Failed to login:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// TODO: stop bots from creating multiple anonymous users
authRouter.get('/anonymous', async (req: Request, res: Response) => {
  // Create a new user called Anonymous
  // Add security to prevent multiple anonymous users by bots
  console.log("Creating anonymous user");
  try {
    const user = await dbOperations.getAnonymousUser();
    console.log(user);
    const sessionToken = await createSession(user.id);

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
    });

    res.json({ status: 'Success' });
  } catch (error) {
    console.error('Failed to login:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Profile Route
authRouter.get('/profile', authenticateSession, async (req: Request, res: Response, next: NextFunction) => {
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

    res.json({ username: user.username, created_at: user.created_at });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    next(error);
  }
});

authRouter.get('/protected-route', authenticateSession, (req: any, res: Response) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

authRouter.post('/logout', authenticateSession, async (req: Request, res: Response, next: NextFunction) => {
  // If the user is authenticated, proceed to clear the session token cookie
  await revokeSession((req as any).user?.userId); // Revoke the session token
  res.clearCookie('sessionToken'); // Clear the session token cookie
  res.json({ status: 'Success' }); // Return success response
});

authRouter.get('/isadmin', authenticateSession, authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  res.json({ isAdmin: true });
});

authRouter.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Test endpoint' });
});

export default authRouter;