import { dbOperations } from '@/db/operations';
import type { DiscordUserRequest, RecaptchaResponse, RequestWithRecaptcha } from '@/types/types';
import express, { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { verifyAccessToken } from './index';

const JWT_SECRET = process.env.JWT_SECRET!;
const MODE = process.env.NODE_ENV || 'development'; // Default to development mode, ensure this is set to 'production' in prod


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