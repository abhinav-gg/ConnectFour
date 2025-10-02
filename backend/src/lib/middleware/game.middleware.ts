import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest, getReqPlayerUUID } from './auth.middleware';
import { redisOps } from '@/redis/ops';
import { myConfig } from '@config/env';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';
import { gameService } from '@/services/game.service';
import { getIdentity } from '@/utils/validation';
import { RoomSchema } from '@/controllers/socket/socketRoomSchema';
import { leaveUserRooms } from '@/controllers/socket/handlers';
import { GameContext } from '@/utils/gameContext';
import { GameState } from '@shared/constants/allgamestates';

export const sendUserToGame = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

    try {
        const userId = getReqPlayerUUID(req);
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);
        
        if (gameId) {
            // Check if the game is actually active (not finished/aborted)
            const metadata = await r.game.getGameMetadata(gameId);
            
            console.log(`[🎮 MIDDLEWARE] User ${userId} has gameId ${gameId}, checking game state:`, {
                gameId,
                state: metadata?.state,
                hasMetadata: !!metadata
            });
            
            if (metadata && (metadata.state === GameState.IN_PROGRESS || metadata.state === GameState.SCHEDULED)) {
                console.log(`[🎮 MIDDLEWARE] User ${userId} is in active game ${gameId} (${metadata.state}), redirecting...`);
                // Redirect the user to the game
                res.status(302).json({ gameLink: `/game?r=${gameId}` });
                return;
            } else {
                // Game exists but is not active (finished/aborted) - clean up the user's game reference
                console.log(`[🎮 MIDDLEWARE] Game ${gameId} is not active (state: ${metadata?.state}), removing user's game reference`);
                await r.game.leaveUserQueue(userId);
                console.log(`[🎮 MIDDLEWARE] Cleaned up inactive game reference for user ${userId}`);
                // Continue to next middleware
                return next();
            }
        } else {
          console.log(`[🎮 MIDDLEWARE] User ${userId} has no active game, continuing to next middleware`);
          // No game found, continue to the next middleware
          return next();
        }
    } catch (error) {
        console.error(`[🎮 MIDDLEWARE ERROR] Error checking user game state:`, error);
        // No authentication or error getting user info, continue to next middleware
        return next();
    }

};

export const getIdentityFromSocket = (socket: Socket): string | null => {
    return (socket as any).identity || null;
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
      return;
    }

    if ((socket as any).sessionId === sessionId)
      return next();

    const redis = await redisOps();

    const userId = await redis.user.getSession(sessionId!);
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    (socket as any).sessionId = sessionId;
    (socket as any).identity = userId;
    leaveUserRooms(socket);
    console.log(`[Socket] Socket ${socket.id} User ${userId} authenticated with session ${sessionId}`);
    socket.join(RoomSchema.user.key(userId));
    return next();

  } catch (err: any) {
    console.error('Socket auth error:', err);
    return next(err)
  }
}



/**
 * Websocket Session Middleware
 * @param socket 
 * @param next 
 * @returns 
 */
export const sendSocketUserToGame = async (socket: Socket, next: (err?: any) => void): Promise<void> => {

  try {
    const userId = (socket as any).identity;
    if (!userId) {
      return next(new Error('User not authenticated'));
    }
    const r = await redisOps();
    const gameId = await r.game.getUserQueueGameId(userId);
    
    if (gameId) {
      // Check if the game is actually active (not finished/aborted)
      const metadata = await r.game.getGameMetadata(gameId);
      
      console.log(`[🎮 SOCKET] User ${userId} has gameId ${gameId}, checking game state:`, {
        gameId,
        state: metadata?.state,
        hasMetadata: !!metadata
      });
      
      if (metadata && (metadata.state === GameState.IN_PROGRESS || metadata.state === GameState.SCHEDULED)) {
        console.log(`[🎮 SOCKET] User ${userId} is in active game ${gameId} (${metadata.state}), redirecting...`);
        // Redirect the user to the game
        socket.emit('redirect', { gameLink: `/game/${gameId}` });
        return;
      } else {
        // Game exists but is not active (finished/aborted) - clean up the user's game reference
        console.log(`[🎮 SOCKET] Game ${gameId} is not active (state: ${metadata?.state}), removing user's game reference`);
        await r.game.leaveUserQueue(userId);
        console.log(`[🎮 SOCKET] Cleaned up inactive game reference for user ${userId}`);
        // Continue to next middleware
        return next();
      }
    } else {
      console.log(`[🎮 SOCKET] User ${userId} has no active game, continuing to next middleware`);
      // No game found, continue to the next middleware
      return next();
    }
  } catch (error) {
    console.error(`[🎮 SOCKET ERROR] Error checking user game state:`, error);
    // No authentication or error getting user info, continue to next middleware
    return next();
  }

}
