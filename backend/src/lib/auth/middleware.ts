import { dbOperations } from '@/db/operations';
import type { DiscordUserRequest, RecaptchaResponse, RequestWithRecaptcha } from '@/types/types';
import express, { NextFunction, Request, Response } from 'express';
import { getUserFromSession } from './index';

const MODE = process.env.NODE_ENV || 'development'; // Default to development mode, ensure this is set to 'production' in prod

// discord stuff
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || '';

interface AuthenticatedRequest extends Request {
  user?: { userId: string | null; };
}

export const authenticateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the header
  if (!token) {
    res.status(401).json({ error: 'Session token required' });
    return; // Ensure we return here to avoid further execution
  }

  try {
    const decoded = await getUserFromSession(token); // Decode the token
    // check if decoded is promise null and raise error
    if (!decoded.userId) {
      throw new Error('Invalid or expired token');
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


    console.log('User ID:', user.id);
    // call ICH database here


    next();
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const verifyRecaptcha = async (req: RequestWithRecaptcha, res: Response, next: NextFunction): Promise<void> => {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const token = req.query.token || req.body.token;

    // /!\ ----------------------
    if (MODE === 'development') {
      console.log('Skipping reCAPTCHA verification in development mode');
      next();
      return;
    }
    // --------------------------

    if (!secret || !token) {
      res.status(403).json({
        success: false,
        message: 'reCAPTCHA verification failed'
      });
      return;
    }

    const query = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      }
    );

    const apiResponse: RecaptchaResponse = await query.json();

    if (!apiResponse.success || apiResponse.score < 0.5) {
      res.status(403).json({
        success: false,
        message: 'reCAPTCHA verification failed',
      });
      return;
    }

    // Add verification result to request object
    req.recaptchaResult = apiResponse;
    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
    return;
  }
};