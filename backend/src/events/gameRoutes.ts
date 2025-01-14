// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { dbOperations } from '@/db/operations';
import { TimeControl } from '@shared/Models/gameInfo';
import { authenticateJWT } from '@/lib/auth/middleware';
import * as globals from '@shared/constants';
import { quitGameSearch } from './gameHelper';
import { GameRequest } from '@/models/Game';

const gameRouter = Router();

// Create Game Route
gameRouter.post('/request', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
    // Extract the user ID from the request
    const userId = (req as any).user?.userId;
    const { gameMode, timeControl } = req.body as GameRequest;

    console.log('Create Game:', userId, timeControl);

    // Check if the user is already in the game lookup
    const gameId = await dbOperations.GetGameLookupByPlayer(userId);
    const GMM = gameMode.name;
    const gameModeID = globals.FriendlyNoEventGameMode 
    // TODO: Use gameMode.event and gameMode.name to determine the game mode id from database
    //       Not for exotic gamemodes or events - require database entry

    if (gameId) {
        // First check if the game is still active
        try {
            const state = await dbOperations.GetGameStatusById(gameId);
            if (state === 'ongoing') {
                res.status(200).json({ message: 'Game is still active, player must finish their game before making a new one' });
                return;
            }
            // User is changing the game they are looking for
            // Remove the user from the lookup and prepare for new game
            await quitGameSearch(userId);
        }
        catch (error) {
            console.log('Failed to remove user from game search:', error);
            return;
        }
    }

    switch (GMM) {
        case 'standard':
            //////////////////////////////////////////////////////////////////
            // Call Matchmaking if they are looking for a competitive game
            //////////////////////////////////////////////////////////////////
        
            // If that fails then go to waiting room
            
            break;
        
        case 'friendly':

            
            // Add user to the game search

            break;

    }

});


gameRouter.post('/accept', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
    // dunno if we need this
});

gameRouter.get('/test', async (req: Request, res: Response) => {
    res.json({ message: 'Game routes are working!' });
});


export default gameRouter;
