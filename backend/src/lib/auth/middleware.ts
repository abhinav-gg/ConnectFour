import { dbOperations } from '@/db/operations';
import type { DiscordUserRequest } from '@/types/types';
import express, { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { verifyAccessToken } from './index';

const JWT_SECRET = process.env.JWT_SECRET!;

// discord stuff
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || '';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the header
  // TODO: ivan to check for "NONE" signing algorithm (should NOT be accepted)
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return; // Ensure we return here to avoid further execution
  }

  try {
    const decoded = verifyAccessToken(token); // Verify the token
    // check if decoded is promise null and raise error
    if (!decoded) {
      throw new Error('Unable to decode token');
    }
    else {
      req.user = decoded; // Attach user info to the request
      next(); // Call next to pass control to the next middleware
    }
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return; // Ensure we return here to avoid further execution
  }
};

export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.userId;
  console.log('User ID:', userId, req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const tags = await dbOperations.getAllUserTagNames(userId);
    if (!tags) {
      res.status(404).json({ error: 'Page Not Found' });
      return;
    }

    if (!tags.includes('Admin')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    next(error);
  }
};

export const handleDiscordCallback = async (
  req: DiscordUserRequest,
  res: express.Response,
  next: NextFunction
): Promise<void> => {
  try {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({ error: 'Authorization code not provided' });
      return;
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }).toString()
    });

    if (!tokenResponse.ok) {
      throw new Error(`HTTP error! status: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Use the access token to fetch the user's information
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    if (!userResponse.ok) {
      throw new Error(`HTTP error! status: ${userResponse.status}`);
    }

    const user = await userResponse.json();

    req.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
    };

    // ABHINAV ----------------------
    // here is your User ID
    console.log('User ID:', user.id);
    // ------------------------------

    next();
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
