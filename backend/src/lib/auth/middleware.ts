import { dbOperations } from '@/db/operations';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { verifyAccessToken } from './index';

const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the header

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
      console.log('Decoded:', decoded, 'Token:', token);
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
