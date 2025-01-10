import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the header
  console.log(token);
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return; // Ensure we return here to avoid further execution
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded; // Attach user info to the request
    next(); // Call next to pass control to the next middleware
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return; // Ensure we return here to avoid further execution
  }
};
