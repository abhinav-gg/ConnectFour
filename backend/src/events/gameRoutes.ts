// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbOperations } from '@/db/operations';
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from '@/lib/auth/index';
import { authenticateJWT } from '@/lib/auth/middleware';
import * as dbErrors from '@/db/dbErrors';

const gameRouter = Router();

// Create Game Route
gameRouter.post('/create', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
    // Extract the user ID from the request
    const userId = (req as any).user?.userId;

    // Call Matchmaking if they are looking for a competitive game
});


gameRouter.post('')