import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email || !req.body.email.includes('@')) {
      return res.status(400).json({
        error: 'Validation failed',
        details: 'Invalid email format'
      });
    }
    next();
  };
};
