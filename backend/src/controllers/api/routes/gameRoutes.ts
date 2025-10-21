// src/routes/authRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticateSession, verifyRecaptcha, AuthenticatedRequest, getReqPlayerUUID } from '@/lib/middleware/auth.middleware';
import { GameInfo, GameSetupParams, TimeControl } from '@shared/types/game.types';
import { GameMode, t_GameMode } from '@shared/constants/allgamemodes';
import { getGameModeByTimeControl, CompetitiveModes, sRankedArmageddonModes, sRankedModes, CasualModes, getEloGameMode, StandardModes } from '@shared/utils/gamemodes';
import { validateTimeControl } from '@shared/utils/validation';
import { gameService } from '@/services/game.service';
import { rdsDBOps } from '@/db/rds/ops';
import { userService } from '@/services/user.service';
import { sendUserToGameMiddleware } from '@/lib/middleware/game.middleware';
import { getIdentityString } from '@/utils/validation';
import { GameContext } from '@/utils/gameContext';
import { isValidBotId } from '@/tools/Bots';
import { PlayAs } from "@shared/types/game.types";

const gameRouter = Router();


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
        let cGameMode: t_GameMode | null = getEloGameMode(mode);
        if (!cGameMode) {
            throw new Error("Invalid gamemode for elo fetch");
        }
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
gameRouter.post('/request', authenticateSession, verifyRecaptcha, sendUserToGameMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
    let playerColor: PlayAs;
    
    try {
        const body = req.body;
        gamemode = body.gamemode;
        time_control = body.time_control;
        playerColor = body.playerColor; // Optional
        botId = body.botId; // Optional - flag for bot opponent game
        
        console.log('Game request data:', { userId, gamemode, time_control, botId, playerColor });

        if (!gamemode || !time_control || !userId) {
            throw new Error('Invalid Data');
        }

        if (!validateTimeControl(time_control)) {
            throw new Error('Invalid time control settings');
        }

        // if playerColor is provided, validate it
        if (
            playerColor &&
            (!Object.values(PlayAs).includes(playerColor) &&
            playerColor !== PlayAs.NOTINGAME)
        ) {
            throw new Error('Invalid or missing player color for bot game');
        }

        // If botId is provided, validate bot game parameters
        if (gamemode === GameMode.STANDARD_BOT_MATCH) {

            if (botId === undefined || !isValidBotId(botId)) {
                throw new Error('Invalid bot ID');
            }
            
        } else if (CompetitiveModes.has(gamemode)) {

            // Regular game validation

            let modeFromTC: t_GameMode | undefined;
            if (gamemode in sRankedArmageddonModes) {
                modeFromTC = getGameModeByTimeControl(time_control, 'armageddon');
            } else if (gamemode in sRankedModes) {
                modeFromTC = getGameModeByTimeControl(time_control, 'standard');
            }
            
            if (!modeFromTC || modeFromTC !== gamemode) {
                throw new Error('Game mode does not match time control');
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
        
        
        console.log(`Game Request: User ${userId} requested a game with mode ${gamemode} and time control ${time_control}`);
        response = await gameService.joinGameQueue(gameContext, { 
            gamemode, 
            time_control,
            botId,
            playerColor
        } as GameSetupParams);
        
        res.status(response.status).json({ gameLink: `/game?r=${response.message}` });
    }
    catch (error) {
        console.log('Failed to request game:', error);
        res.status(500).json({ error: 'Failed to request game' });
    }
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
