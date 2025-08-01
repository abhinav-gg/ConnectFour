import { RecaptchaResponse, RequestWithRecaptcha } from '@/types/custom';
import { NextFunction, Request, Response } from 'express';
import { myConfig } from '@config/env';
import { PlayerIdentity } from '@/types/custom';
import { authService } from '@/services/auth.service';


export interface AuthenticatedRequest extends Request {
  user?: { userId: string | null; };
}

/** ANONYMOUS OR NONE
 * Middleware to ensure user is NOT logged in
 * Use this for endpoints like login, register, etc.
 * Allow access if the user is not authenticated (null or invalid session token) or anonymous.
 */
export const requireUnauthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.sessionToken;
  
  if (!token) {
    // No token, user is not logged in - allow access
    return next();
  }

  let id: PlayerIdentity = {}
  try {
    id = await authService.validateToken(token)
  } catch {
    return next() // the code was invalid which is also fine...;
  }

  if (id.anon) {
    return next()
  } else if (id.user) {
    res.status(401).json({ error: 'User is signed in' });
  }
  else {
    next()
  }
};

/** ANONYMOUS OR SIGNED IN
 * Middleware to authenticate a session
 * This middleware checks for a session token in the request cookies,
 * If present, set the `req.user` object with the user ID (or anonymous ID).
 */
export const authenticateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

  const token = req.cookies.sessionToken; // Get the session token from the request cookies
  if (!token) {
    res.status(401).json({ error: 'Session token required' });
    return; // Ensure we return here to avoid further execution
  }

  let id: PlayerIdentity = {}
  try {
    id = await authService.validateToken(token)
  } catch {
    res.status(403).json({ error: 'Error evaluating token' });
    return
  }
  
  if (id.anon) {
    req.user = {userId: id.anon}
    return next();
  } else if (id.user) {
    req.user = {userId: id.user}
    return next();
  } // bots can't login
  else {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/** SIGNED IN
 * Requires the user to be signed in (not anonymous or bot)
 * If the user is not signed in, send a 401 Unauthorized response.
 */
export const requireSignedIn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.sessionToken;
  
  if (!token) {
    res.status(401).json({ error: 'Session token required' });
    return;
  }

  let id: PlayerIdentity = {}
  try {
    id = await authService.validateToken(token)
  } catch {
    res.status(403).json({ error: 'Error evaluating token' });
  }
  
  if (id.anon) {
    res.status(401).json({ error: 'User is anonymous still' });
    return;
  } else if (id.user) {
    next()
  }
  else {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/** OPTIONAL AUTHENTICATION
 * Optional authentication middleware
 * Attaches user info if logged in, but doesn't require authentication
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.sessionToken;
  
  if (!token) {
    // No token, continue without user info
    next();
    return;
  }

  let id: PlayerIdentity = {}
  try {
    id = await authService.validateToken(token)
  } catch {
    // the code was invalid which is also fine...
    return next()
  }
  
  if (id.anon) {
    req.user = {userId: id.anon}
    return next()
  } else if (id.user) {
    req.user = {userId: id.user}
    return next()
  }
  else {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////

export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.userId;
  console.log('User ID:', userId, req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Check the user with tag "Admin"
    if (!(await authService.checkAdministrator(userId))) {
      res.status(404); // just pretend the page doesn't exist
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
    const secret = myConfig.GOOGLE_RECAPTCHA_SECRET_KEY;
    const token = req.query.recaptchaToken || req.body.recaptchaToken;

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


