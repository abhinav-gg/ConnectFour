// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticateSession, verifyRecaptcha } from '@/lib/auth/middleware';
import { GameInfo, TimeControl } from '@shared/types/game';
import { GameMode } from '@shared/constants/allgamemodes';
import { getRankedGameModeByTimeControl, CompetitiveModes, sRankedArmageddonModes, sRankedModes, CasualModes } from '@shared/utils/gamemodes';
import { validateTimeControl } from '@shared/utils/validation';


const gameRouter = Router();

// Create Game Route
gameRouter.post('/request', authenticateSession, verifyRecaptcha, async (req: Request, res: Response, next: NextFunction) => {
    // Extract the user ID from the request

    const userId = (req as any).user.userId;

    let gamemode: GameMode;
    let time_control: TimeControl;
    try {
        gamemode = (req.body as GameInfo).gamemode;
        time_control = (req.body as GameInfo).time_control;
        if (!gamemode || !time_control || !userId) {
            throw new Error('Invalid Data');
        }

        if (!validateTimeControl(time_control)) {
            throw new Error('Invalid time control settings');
        }

        let modeFromTC: GameMode | undefined;
        if (gamemode in sRankedArmageddonModes) {
            modeFromTC = getRankedGameModeByTimeControl(time_control, 'armageddon');
        } else if (gamemode in sRankedModes) {
            modeFromTC = getRankedGameModeByTimeControl(time_control, 'standard');
        }

        if (modeFromTC) {
            if (modeFromTC !== gamemode) {
                throw new Error('Game mode does not match time control');
            }
        }

    }
    catch (error) {
        console.log('Failed to extract or validate data:', error);
        res.status(500).json({ error: 'Invalid Data' });
        return;
    }

    if (gamemode in CompetitiveModes) {
        // Call matchmaking service







    } else if (gamemode in CasualModes) {

        // create game here









    } else {
        res.status(400).json({ error: 'Invalid Game Mode' });
        return;
    }

    console.log("Game Requested");
});

gameRouter.get('/test', async (req: Request, res: Response) => {
    res.json({ message: 'Game routes are live!' });
});


// Fetch all necessary gamedata for the frontend to display analysis and later game reveiw

// // gameRouter.post('/review', authenticateSession, async (req: Request, res: Response) => {
// //     // extract the roomId from the request
// //     const roomId = req.body.roomId;

// //     if (!roomId) {
// //         res.status(500).json({ error: 'Invalid Data' });
// //         return;
// //     }

// //     // Check if the game is still active
// //     try {
// //         const game = await dbOperations.GetGameByShortCode(roomId);
// //         if (game.state === globals.StandardGameStates.ongoing
// //             || game.state === globals.StandardGameStates.scheduled) {
// //             res.status(200).json({
// //                 event: "sendToRoom",
// //                 data: { roomId }
// //             } as SendToRoom);
// //             return;
// //         }
// //     }
// //     catch (error) {
// //         console.log('Failed to remove user from game search:', error);
// //         return;
// //     }
// //     const moves = await dbOperations.GetMovesByShortCode(roomId);

// //     const moveList = moves.map((move) => { move.col });

// //     res.status(200).json({
// //         event: "something",
// //         data: { roomId, moves: moveList }
// //     }); // change as needed to return the moves
// // });


// // gameRouter.post('/status', authenticateSession, async (req: Request, res: Response) => {
// //     // Check if the player is already in a game
// //     const userId = (req as any).user?.userId;

// //     if (!userId) {
// //         res.status(500).json({ error: 'Invalid Data' });
// //         return;
// //     }

// //     const gameId = await dbOperations.GetGameByPlayerLookup(userId);
// //     console.log('Game ID:', gameId);

// //     if (gameId) {
// //         // First check if the game is still active
// //         try {
// //             const game = await dbOperations.GetGameByID(gameId);
// //             if (game.state === globals.StandardGameStates.ongoing) {
// //                 // return an error with the shortcode of the ongoing game to redirect to
// //                 res.status(200).json({
// //                     event: "sendToRoom",
// //                     data: { roomId: game.short_id }
// //                 } as SendToRoom);
// //                 return;
// //             } else if (game.state === globals.StandardGameStates.scheduled) {
// //                 // User is changing the game they are looking for
// //                 // Remove the user from the lookup and prepare for new game
// //                 await quitGameSearch(userId);

// //             } else {
// //                 throw new Error('GameLookup is not in a state');
// //             }
// //         }
// //         catch (error) {
// //             console.error('Failed to remove user from game search:', error);
// //             return;
// //         }
// //     }
// //     res.status(200).json({ message: 'No game found' });
// // });



export default gameRouter;
