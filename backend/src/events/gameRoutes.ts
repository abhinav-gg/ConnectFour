// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { dbOperations } from '@/db/operations';
import { GameMode, SendToRoom, TimeControl } from '@shared/Models/gameInfo';
import { authenticateJWT } from '@/lib/auth/middleware';
import * as globals from '@shared/constants';
import { abortGame, CategoriseTime, createGame, quitGameSearch } from './gameHelper';
import { GameInfo } from '@shared/Models/gameInfo';
import { FindCompetitiveMatch } from './matchmaking';

const gameRouter = Router();

// Create Game Route
gameRouter.post('/request', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
    // Extract the user ID from the request
    let gamemode: GameMode;
    let time_control: TimeControl;
    const userId = (req as any).user.userId;
    if (!userId) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }
    try {
        gamemode = (req.body as GameInfo).gamemode;
        time_control = (req.body as GameInfo).time_control;
        if (!gamemode || !time_control || !userId) {
            throw new Error('Invalid Data');
        }
        if (gamemode.name !== globals.StandardGameModes.friendly) {

            const timeMode = CategoriseTime(time_control);
            console.log('Time Mode:', timeMode);
            switch (timeMode) {
                case 'blitz':
                    gamemode.name = globals.StandardGameModes.standard.blitz;
                    break;
                case 'rapid':
                    gamemode.name = globals.StandardGameModes.standard.rapid;
                    break;
                case 'bullet':
                    gamemode.name = globals.StandardGameModes.standard.bullet;
                    break;
                default:
                    throw new Error('Invalid Time Control');
            }
        }
    }
    catch (error) {
        console.log('Failed to extract data:', error);
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    console.log('Create Game:', userId, time_control, gamemode);

    // Check if the user is already in the game lookup
    const gameId = await dbOperations.GetGameByPlayerLookup(userId);
    console.log('Game ID:', gameId);
    if (gameId) {
        // First check if the game is still active
        try {
            const game = await dbOperations.GetGameByID(gameId);

            if (game.state === globals.StandardGameStates.ongoing) {
                res.status(200).json({ event: 'sendToRoom', 
                    data: { roomId: game.short_id }
            } as SendToRoom);
                return;
            }
            else if (game.state === globals.StandardGameStates.scheduled) {
                await abortGame(userId);
            }
            else {
                throw new Error('Game is over, let them review the game');
            }
        }
        catch (error) {
            console.log('Failed to remove user from game search:', error);
            return;
        }
    }
    else await dbOperations.FinishedGameLookup(userId);

    const GMM = gamemode.name;

    const mainMade = GMM.split('-')[0];
    console.log('Game Mode:', GMM, mainMade);
    switch (mainMade) {
        case 'standard':
            //////////////////////////////////////////////////////////////////
            // Call Matchmaking if they are looking for a competitive game
            //////////////////////////////////////////////////////////////////
            const user = await dbOperations.getUserByID(userId);
            if (user.is_anonymous) {
                res.status(403).json({ error: 'User is not logged in for competitive games' });
                return;
            }
            // README: Make the game after the matchmaking is done incase of a failure 
            //                          / two people in different games are matched
            try {
                const roomId = await FindCompetitiveMatch(userId, time_control, gamemode);

                if (!roomId) {
                    res.status(404).json({ message: 'No match found, player must wait' });
                    return; // link to frontend waiting room
                }

                res.status(200).json({
                    event: "sendToRoom",
                    data: { roomId }
                } as SendToRoom);
            }
            catch (error) {
                console.log('Failed to find competitive match:', error);
                res.status(500).json({ error: 'Failed to find competitive match' });
            }
            break;

        case 'friendly':

            try {
                // create game
                const game = await createGame(gamemode, time_control);
                console.log(game.id, game.short_id);

                // Add user to the game lookup
                await dbOperations.BeginFindingGame(userId, game.game_info, game.id);

                // tell user to redirect to the game at the shortcode 
                res.status(200).json({
                    event: "sendToRoom",
                    data: { roomId: game.short_id }
                } as SendToRoom);
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

gameRouter.post('/review', async (req: Request, res: Response) => {
    // extract the roomId from the request
    const roomId = req.body.roomId;

    if (!roomId) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    // Check if the game is still active
    try {
        const game = await dbOperations.GetGameByShortCode(roomId);
        if (game.state === globals.StandardGameStates.ongoing
            || game.state === globals.StandardGameStates.scheduled) {
            res.status(200).json({
                event: "sendToRoom",
                data: { roomId }
            } as SendToRoom);
            return;
        }
    }
    catch (error) {
        console.log('Failed to remove user from game search:', error);
        return;
    }
    const moves = await dbOperations.GetMovesByShortCode(roomId);

    const moveList = moves.map((move) => { move.col });

    res.status(200).json({
        event: "something",
        data: { roomId, moves: moveList }
    }); // change as needed to return the moves
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
                res.status(200).json({
                    event: "sendToRoom",
                    data: { roomId: game.short_id }
                } as SendToRoom);
                return;
            } else if (game.state === globals.StandardGameStates.scheduled) {
                // User is changing the game they are looking for
                // Remove the user from the lookup and prepare for new game
                await quitGameSearch(userId);

            } else {
                throw new Error('GameLookup is not in a state');
            }
        }
        catch (error) {
            console.error('Failed to remove user from game search:', error);
            return;
        }
    }
    res.status(200).json({ message: 'No game found' });
});

gameRouter.post('/get-leaderboard', async (req: Request, res: Response) => {
    // Check the gamemode and event and fetch the leaderboard from database
});

gameRouter.post('/get-game-history', async (req: Request, res: Response) => {
});

gameRouter.post('/profile', authenticateJWT, async (req: Request, res: Response) => {
    // Check the user ID and fetch the user profile from the database
    const userId = req.body.userId;
    const gamemodeId = req.body.gamemodeId;

    if (!userId || !gamemodeId) {
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    const elo = await dbOperations.GetPlayerStats(userId, gamemodeId);

});

export default gameRouter;
