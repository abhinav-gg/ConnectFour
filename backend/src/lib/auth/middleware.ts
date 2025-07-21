import { RecaptchaResponse, RequestWithRecaptcha } from '@/types/custom';
import { NextFunction, Request, Response } from 'express';
import { myConfig } from '@/config/env';
import { redisOps } from '@/redis/ops';
import { Socket } from 'socket.io';


interface AuthenticatedRequest extends Request {
  user?: { userId: string | null; };
}

export const authenticateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

  const token = req.cookies.sessionToken; // Get the session token from the request cookies
  if (!token) {
    res.status(401).json({ error: 'Session token required' });
    return; // Ensure we return here to avoid further execution
  }

  try {
    const redisOp = await redisOps(); // Get the Redis connection

    const sessionUserID = await redisOp.user.getSession(token); // Decode the session token
    // check if decoded is promise null and raise error
    if (sessionUserID === null) {
      throw new Error('Invalid or expired token');
    }
    else {
      req.user = { userId: sessionUserID }; // Attach user info to the request
      next(); // Call next to pass control to the next middleware
    }
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return; // Ensure we return here to avoid further execution
  }
};

/**
 * Middleware to ensure user is NOT logged in
 * Use this for endpoints like login, register, etc.
 */
export const requireUnauthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.sessionToken;
  
  if (!token) {
    // No token, user is not logged in - allow access
    next();
    return;
  }

  try {
    const redisOp = await redisOps();
    const sessionUserID = await redisOp.user.getSession(token);
    
    if (sessionUserID === null) {
      // Invalid/expired token, user is not logged in - allow access
      next();
      return;
    }
    
    // User is logged in - deny access
    res.status(403).json({ 
      error: 'Already authenticated',
      message: 'You are already logged in. Please logout first to access this endpoint.'
    });
    return;
  } catch (err) {
    // Error occurred, assume user is not logged in - allow access
    next();
    return;
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if logged in, but doesn't require authentication
 */
// export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
//   const token = req.cookies.sessionToken;
  
//   if (!token) {
//     // No token, continue without user info
//     next();
//     return;
//   }

//   try {
//     const redisOp = await redisOps();
//     const sessionUserID = await redisOp.user.getSession(token);
    
//     if (sessionUserID !== null) {
//       req.user = { userId: sessionUserID };
//     }
    
//     next();
//   } catch (err) {
//     // Error occurred, continue without user info
//     next();
//   }
// };

export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.userId;
  console.log('User ID:', userId, req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Check the user with tag "Admin"

    

    next();
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    next(error);
  }
};

export const verifyRecaptcha = async (req: RequestWithRecaptcha, res: Response, next: NextFunction): Promise<void> => {
  try {
    const secret = myConfig.GOOGLE_RECAPTCHA_SECRET_KEY;
    const token = req.query.token || req.body.token;

    // /!\ ----------------------
    if (myConfig.NODE_ENV === 'development') {
      console.log('Skipping reCAPTCHA verification in development mode');
      next();
      return;
    }
    // --------------------------

    if (!secret || !token) {
      console.log("missing secret or token");
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

    const apiResponse = await query.json() as RecaptchaResponse;

    if (!apiResponse.success || apiResponse.score < 0.5) {
      console.log('reCAPTCHA verification failed:', apiResponse);
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





export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const sessionId = socket.handshake.auth?.sessionId;

  if (!sessionId) {
    return next(new Error('Missing sessionId'));
  }

  try {
    const redis = await redisOps();
    const userId = await redis.user.getSession(sessionId);

    if (!userId) {
      return next(new Error('Invalid or expired session'));
    }

    socket.data.userId = userId;
    next();
  } catch (err) {
    console.error('Session validation error:', err);
    next(new Error('Session validation failed'));
  }
}



