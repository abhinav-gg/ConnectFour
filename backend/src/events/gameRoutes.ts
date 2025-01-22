// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { dbOperations } from '@/db/operations';
import { GameMode, SendToRoom, TimeControl } from '@shared/Models/gameInfo';
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
    const user = (req as any).user;
    console.log(req.body)
    try {
        userId = user?.userId;
        gamemode = (req.body as GameInfo).gamemode;
        time_control = (req.body as GameInfo).time_control;
        if (!gamemode || !time_control || !userId) {
            throw new Error('Invalid Data');
        }
        if (user!.is_anonymous && gamemode.name !== globals.StandardGameModes.friendly) {
            throw new Error('User is not logged in for competitive games');
        }
    }
    catch (error) {
        console.log('Failed to extract data:', error);
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    console.log('Create Game:', userId, time_control);

    // Check if the user is already in the game lookup
    const gameId = await dbOperations.GetGameByPlayerLookup(userId);
    console.log('Game ID:', gameId);
    if (gameId) {
        // First check if the game is still active
        try {
            const game = await dbOperations.GetGameByID(gameId);
            if (game.state === globals.StandardGameStates.ongoing) {
                res.status(200).json({ message: 'Game is still active, player must finish their game before making a new one' });
                return;
            }
            else if (game.state === globals.StandardGameStates.scheduled) {
                // User is changing the game they are looking for
                // Remove the user from the lookup and prepare for new game
                console.log('Quitting game search');
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

    const mainMade = GMM.split('-')[0];
    console.log('Game Mode:', GMM, mainMade);
    switch (mainMade) {
        case 'standard':
            //////////////////////////////////////////////////////////////////
            // Call Matchmaking if they are looking for a competitive game
            //////////////////////////////////////////////////////////////////
            if (user.is_anonymous) {
                res.status(403).json({ error: 'User is not logged in for competitive games' });
                return;
            }
            // If that fails then go to waiting room


            // README: Make the game after the matchamking is done incase of a failure 
            //                          / two people in different games are matched

            // if (error === PlayerEloNotFound) {
            //     dbOperations.SetPlayerElo(userId, gamemode_id, defaultElo);
            //     return 1000;
            // }
            break;
        
        case 'friendly':

            try {
                // create game
                const game = await createGame(gamemode, time_control);
                console.log(game.id, game.short_id);

                // Add user to the game lookup
                await dbOperations.BeginFindingGame(userId, game.game_info, game.id);

                // tell user to redirect to the game at the shortcode 
                res.status(200).json({ event: "sendToRoom",
                    data: { roomId: game.short_id } } as SendToRoom);
            }
            catch (error) {
                console.log('Failed to create game:', error);
                res.status(500).json({ error: 'Failed to create game' });
            }
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

gameRouter.post('/status', authenticateJWT, async (req: Request, res: Response) => {
    // Check if the player is already in a game
    const userId = (req as any).user?.userId;

    if (!userId) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    const gameId = await dbOperations.GetGameByPlayerLookup(userId);
    console.log('Game ID:', gameId);

    if (gameId) {
        // First check if the game is still active
        try {
            const game = await dbOperations.GetGameByID(gameId);
            if (game.state === globals.StandardGameStates.ongoing) {
                // return an error with the shortcode of the ongoing game to redirect to
                res.status(200).json({ event: "sendToRoom",
                    data: { roomId: game.short_id } } as SendToRoom);
                return;
            }
            else if (game.state === globals.StandardGameStates.scheduled) {
                // User is changing the game they are looking for
                // Remove the user from the lookup and prepare for new game
                await quitGameSearch(userId);
            }
            else {
                throw new Error('Game is not in a state');
            }
        }
        catch (error) {
            console.log('Failed to remove user from game search:', error);
            return;
        }
    }
    res.status(200).json({ message: 'No game found' });
});

gameRouter.post('/get-leaderboard', async (req: Request, res: Response) => {
    // Check the gamemode and event and fetch the leaderboard from database
});

export default gameRouter;
