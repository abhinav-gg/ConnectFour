import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from './auth/middleware';
import { redisOps } from '@/redis/ops';
import { myConfig } from '@config/env';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';

export const sendUserToGame = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

    const token = req.user?.userId; // Get the session token from the request cookies
  
    if (token) {

        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(token);
        if (gameId) {
            // Redirect the user to the game
            return res.redirect(`${myConfig.CLIENT_URL}/game/live/${gameId}`);
        } else {
          // No game found, continue to the next middleware
          return next();
        }
    }
    else return next();
};




/**
 * Websocket Session Middleware
 * @param socket 
 * @param next 
 * @returns 
 */
export const verifySocket = async (socket: Socket, next: (err?: any) => void): Promise<void> => {

  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const sessionId = cookies['sessionToken'];
    if (!sessionId) {
      socket.disconnect(true);
    }

    if ((socket as any).sessionId === sessionId)
      return next();

    const redis = await redisOps();

    const userId = await redis.user.getSession(sessionId!);
    if (!userId) {
      socket.disconnect(true);
    }

    (socket as any).sessionId = sessionId;
    (socket as any).userId = userId;
    return next();

  } catch (err: any) {
    console.error('Socket auth error:', err);
    return next(err)
  }
}
