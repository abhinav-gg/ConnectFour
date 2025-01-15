// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { dbOperations } from '@/db/operations';
import { GameMode, TimeControl } from '@shared/Models/gameInfo';
import { authenticateJWT } from '@/lib/auth/middleware';
import * as globals from '@shared/constants';
import { createGame, quitGameSearch } from './gameHelper';
import { GameInfo } from '@shared/Models/gameInfo';

const gameRouter = Router();

// Create Game Route
gameRouter.post('/request', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
    // Extract the user ID from the request
    let gamemode : GameMode;
    let time_control : TimeControl;
    let userId
    console.log(req.body)
    try {
        userId = (req as any).user?.userId;
        gamemode = (req.body as GameInfo).gamemode;
        time_control = (req.body as GameInfo).time_control;
        if (!gamemode || !time_control || !userId) {
            throw new Error('Invalid Data');
        }
    }
    catch (error) {
        console.log('Failed to extract data:', error);
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    console.log('Create Game:', userId, time_control);

    // Check if the user is already in the game lookup
    const gameId = await dbOperations.GetGameLookupByPlayer(userId);
    
    if (gameId) {
        // First check if the game is still active
        try {
            const state = await dbOperations.GetGameStatusById(gameId);
            if (state === 'ongoing') {
                res.status(200).json({ message: 'Game is still active, player must finish their game before making a new one' });
                return;
            }
            else if (state === 'scheduled') {
                // User is changing the game they are looking for
                // Remove the user from the lookup and prepare for new game
                await quitGameSearch(userId);
            }
            else {
                throw new Error('Game is in an unknown state');
            }
        }
        catch (error) {
            console.log('Failed to remove user from game search:', error);
            return;
        }
    }

    const GMM = gamemode.name;
    
    // TODO: Use gameMode.event and gameMode.name to determine the game mode id from database
    //       Not for exotic gamemodes or events - require database entry

    console.log('Game Mode:', GMM);
    switch (GMM) {
        case 'standard':
            //////////////////////////////////////////////////////////////////
            // Call Matchmaking if they are looking for a competitive game
            //////////////////////////////////////////////////////////////////
        
            // If that fails then go to waiting room
            
            break;
        
        case 'friendly':

            
            const { id, short_id } = await createGame(gamemode, time_control);
            // Add user to the game search
            console.log(id, short_id);
            // tell user to redirect to the game at the shortcode 
            res.status(200).json({ message: 'Game Created', short_id });
            break;

        default:

            //await dbOperations.GetGameModeID(gameMode);
            break;
    }
    console.log("Game Requested");
});

gameRouter.get('/test', async (req: Request, res: Response) => {
    res.json({ message: 'Game routes are working!' });
});

gameRouter.post('/get-leaderboard', async (req: Request, res: Response) => {
    // Check the gamemode and event and fetch the leaderboard from database
});

export default gameRouter;
