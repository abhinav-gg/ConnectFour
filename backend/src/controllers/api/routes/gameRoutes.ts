// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticateSession, verifyRecaptcha, AuthenticatedRequest, getReqPlayerUUID } from '@/lib/middleware/auth.middleware';
import { GameInfo, TimeControl } from '@shared/types/game.types';
import { t_GameMode } from '@shared/constants/allgamemodes';
import { getGameModeByTimeControl, CompetitiveModes, sRankedArmageddonModes, sRankedModes, CasualModes } from '@shared/utils/gamemodes';
import { validateTimeControl } from '@shared/utils/validation';
import { gameService } from '@/services/game.service';
import { rdsDBOps } from '@/db/rds/ops';
import { userService } from '@/services/user.service';
import { sendUserToGame } from '@/lib/middleware/game.middleware';
import { getIdentityString } from '@/utils/validation';
import { GameContext } from '@/utils/gameContext';
import { maintenanceMiddleware } from '@/lib/middleware/maintenance.middleware';
import { isValidBotId } from '@/tools/Bots';

const gameRouter = Router();

gameRouter.use(maintenanceMiddleware);

gameRouter.post('/player', async (req: Request, res: Response) => {
    // get username from payload
    const username = req.body.username;
    const mode = req.body.mode;

    if (!username) {
        res.status(400).json({ error: 'Username is required' });
        return;
    }
    const user = await rdsDBOps.user.getUserByUsername(username);
    let elo;

    if (mode) {
        elo = await userService.getOrSetPlayerElo(user.id, mode);
    }
    const response = {
        username: user.username,
        pfp: user.profile_pic,
        elo: elo
    };

    res.status(200).json(response);
});

// Create Game Route
gameRouter.post('/request', authenticateSession, verifyRecaptcha, sendUserToGame, async (req: AuthenticatedRequest, res: Response) => {
    let userId: string;
    try {
        userId = getIdentityString(req.identity!);
    } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    let gamemode: t_GameMode;
    let time_control: TimeControl;
    let botId: string | undefined;
    let playerColor: 'red' | 'yellow' | 'random' | undefined;
    
    try {
        const body = req.body;
        gamemode = body.gamemode;
        time_control = body.time_control;
        botId = body.botId; // Optional - indicates bot game
        playerColor = body.playerColor; // Optional - player color for bot games
        
        if (!gamemode || !time_control || !userId) {
            throw new Error('Invalid Data');
        }

        if (!validateTimeControl(time_control)) {
            throw new Error('Invalid time control settings');
        }

        // If botId is provided, validate bot game parameters
        if (botId) {
            if (!isValidBotId(botId)) {
                throw new Error('Invalid bot ID');
            }
            
            if (!playerColor || !['red', 'yellow', 'random'].includes(playerColor)) {
                throw new Error('Invalid or missing player color for bot game');
            }
        } else {
            // Regular game validation
            let modeFromTC: t_GameMode | undefined;
            if (gamemode in sRankedArmageddonModes) {
                modeFromTC = getGameModeByTimeControl(time_control, 'armageddon');
            } else if (gamemode in sRankedModes) {
                modeFromTC = getGameModeByTimeControl(time_control, 'standard');
            }

            if (modeFromTC) {
                if (modeFromTC !== gamemode) {
                    throw new Error('Game mode does not match time control');
                }
            }
        }
    }
    catch (error) {
        console.log('Failed to extract or validate data:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid Data' });
        return;
    }

    try {
        const gameContext = new GameContext(userId);
        let response;
        
        if (botId && playerColor) {
            // Bot game request
            console.log(`Bot Game Request: User ${userId} requested game vs bot ${botId} as ${playerColor} player`);
            response = await gameService.createBotGame(gameContext, {
                gamemode,
                time_control,
                botId,
                playerColor
            });
        } else {
            // Regular multiplayer game request
            console.log(`Game Request: User ${userId} requested a game with mode ${gamemode} and time control ${time_control}`);
            response = await gameService.joinGameQueue(gameContext, { gamemode, time_control });
        }
        
        res.status(response.status).json({ gameLink: `/game?r=${response.message}` });
    }
    catch (error) {
        console.log('Failed to request game:', error);
        res.status(500).json({ error: 'Failed to request game' });
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



export default gameRouter;
