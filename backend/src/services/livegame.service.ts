import { getSocketIO } from "@/controllers/socket";
import { redisOps } from "@/redis/ops";
import { replaceProfanities } from 'no-profanity'
import { gameService } from "./game.service";
import { RoomSchema } from "@/controllers/socket/socketRoomSchema";
import { ServiceResponse } from "@/types/custom";
import { TimedStandardGame } from "@shared/utils/Games/timed-game";
import { GameInfo } from "@shared/types/game";
import { ChatMessage } from "@shared/types/Websocket";
import { userService } from "./user.service";
import { parseUser } from "@/utils/validation";
import { GameContext } from "@/utils/gameContext";

export const liveGameService = {
    

    async AbortGameWithContext(gameContext: GameContext): Promise<void> {
        // Get fresh metadata to check game status
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) return;
        
        // TODO: Add game state checks and termination logic
        // terminate the game with result aborted and sent socketio code to both players
        // remove the game from redis
    },

    async AbortGame(userId: string): Promise<void> {
        // Get user's current game
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);
        if (!gameId) return;

        // Create fresh game context
        const gameContext = await GameContext.fromGameId(userId, gameId);
        await this.AbortGameWithContext(gameContext);
    },

    async HandleDisconnectWithContext(gameContext: GameContext): Promise<void> {
        const socket = getSocketIO();
        // if the user was in a game then this becomes a bit of a problem
        // TODO: Implement disconnect handling logic
    },

    async HandleDisconnect(userId: string): Promise<void> {
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);
        if (!gameId) return;

        // Create fresh game context for the disconnected user
        const gameContext = await GameContext.fromGameId(userId, gameId);
        await this.HandleDisconnectWithContext(gameContext);
    },

    async AttemptDrawWithContext(gameContext: GameContext): Promise<void> {
        // Get fresh game data
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) return;
        
        // if game state is ended do nothing
        // if already offering draw and opponent has not accepted do nothing
        // if opponent is offering draw, accept the draw and end the game
        // if opponent is not offering draw, send a draw offer to the opponent
        // otherwise do nothing
        
        // TODO: Implement draw attempt logic
    },

    async AttemptDraw(userId: string): Promise<void> {
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);
        if (!gameId) return;

        // Create fresh game context
        const gameContext = await GameContext.fromGameId(userId, gameId);
        await this.AttemptDrawWithContext(gameContext);
    },

    async ConfirmDrawWithContext(gameContext: GameContext): Promise<void> {
        // Get fresh game data
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) return;
        
        // if game state is ended do nothing
        // if opponent is offering draw, accept the draw and end the game
        // otherwise do nothing
        
        // TODO: Implement draw confirmation logic
    },

    async ConfirmDraw(userId: string): Promise<void> {
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);
        if (!gameId) return;

        // Create fresh game context
        const gameContext = await GameContext.fromGameId(userId, gameId);
        await this.ConfirmDrawWithContext(gameContext);
    },

    async ResignWithContext(gameContext: GameContext): Promise<void> {
        // Get fresh game data
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) return;
        
        // if game state is ended do nothing
        // current player resigns the game, end and store the game
        // otherwise do nothing
        
        // TODO: Implement resignation logic
    },

    async Resign(userId: string): Promise<void> {
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);
        if (!gameId) return;

        // Create fresh game context
        const gameContext = await GameContext.fromGameId(userId, gameId);
        await this.ResignWithContext(gameContext);
    },



    async HandleChatMessageWithContext(gameContext: GameContext, message: string): Promise<void> {
        // Validate player is in the game room with fresh data
        gameContext.invalidatePlayerData();
        await gameContext.validatePlayerInRoom();
        
        // Get fresh metadata to check game state
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) throw new Error('Game metadata not found');
        
        // if game state is ended do nothing
        // TODO: Add game state check when states are defined
        
        const sanitizedMessage = replaceProfanities(message);
        const username = await userService.safeGetUserByID(parseUser(gameContext.userId));
        
        const playerIndex = await gameContext.getPlayerIndex();
        const color = playerIndex === 0 ? 'red' : 'yellow';

        // send the message to the opponent
        const socket = getSocketIO();
        socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:chat', {
            username: username.username,
            message: sanitizedMessage,
            type: 'user',
            color: color,
        } as ChatMessage);
    },

    async HandleChatMessage(sender: string, shortcode: string, message: string): Promise<void> {
        // Create fresh game context to manage all game data
        const gameContext = await GameContext.fromShortcode(sender, shortcode);
        await this.HandleChatMessageWithContext(gameContext, message);
    },


    async HandleGameMoveWithContext(gameContext: GameContext, col: number): Promise<ServiceResponse> {
        // Validate player is in the game room with fresh data
        gameContext.invalidatePlayerData();
        await gameContext.validatePlayerInRoom();
        
        // Get all fresh game data - invalidate cache first for critical move validation
        gameContext.invalidateAll();
        const { metadata: gameMeta, timedata: gameTimes, moves } = await gameContext.getAllGameData();
        
        if (!gameTimes || !gameMeta || !gameContext.gameId) {
            return { status: 404, message: 'Game metadata not found' };
        }

        // check the sender is the current player with fresh data
        if (!(await gameContext.isCurrentPlayerTurn())) {
            return { status: 403, message: 'Not your turn' };
        }

        // create the game object
        const Game = new TimedStandardGame({
            gamemode: gameMeta.gamemode,
            time_control: {
                base_time: gameMeta.base_time,
                increment: gameMeta.increment,
                disadvantage: gameMeta.disadvantage,
            }
        } as GameInfo);
        
        let lMove = gameTimes.lMove;
        if (!lMove) {
            lMove = Date.now();
        }

        let rTimes = gameTimes.rTimes;
        if (gameTimes.mTimes.length === 0) {
            rTimes = Game.getTimeLeft();
        }
        console.log("BEFORE LOADING STANDARD", rTimes, lMove, gameTimes.cTurn, moves);
        Game.loadStandard(rTimes!, lMove, gameTimes.cTurn, moves);
        
        let deltaTime = -1;
        let result;
        try {
            result = Game.makeMove(col);

            if (!result.success) {
                throw new Error();
            }

            deltaTime = result.deltaTime!;

            
        } catch (error: any) {
            // custom error handling for timed game
            if (error instanceof Error) {}
            return { status: 400, message: 'Invalid move' };
        }

        const r = await redisOps();

        if (Game.isGameOver()) {
            // handle game over logic
            await this.HandleGameOver(gameContext.gameId, Game.getGameState());
            return { status: 200, message: 'Game over' };
        } else {
            // handle the move in redis
            await r.game.addGameMove(gameContext.gameId, col);
            
            // Update cached moves in context
            gameContext.addMoveToCache(col);

            // cancel outstanding game draw offers
            await r.game.cancelGameDrawOffer(gameContext.gameId);
            
            console.log("AFTER ADDING MOVES", gameContext.gameId,
                deltaTime,
                Game.getCurrentPlayer(),
                Game.getTimeLeft() as [number, number],
                Game.getLastMoveTimestamp());
                
            // update the game times
            await r.game.updateGameTimeAfterMove(
                gameContext.gameId,
                deltaTime,
                Game.getCurrentPlayer(),
                Game.getTimeLeft() as [number, number],
                Game.getLastMoveTimestamp(),
            );
            
            // Update cached timedata in context
            const newTimedata = {
                ...gameTimes,
                cTurn: Game.getCurrentPlayer(),
                rTimes: Game.getTimeLeft() as [number, number],
                lMove: Game.getLastMoveTimestamp(),
                mTimes: [...gameTimes.mTimes, deltaTime]
            };
            gameContext.updateCachedTimedata(newTimedata);

            // broadcast the move to the game room
            const socket = getSocketIO();
            socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:move', {
                col,
                row: result.row,
                player: gameTimes.cTurn,
                rTimes: Game.getTimeLeft(),
                lMove: Game.getLastMoveTimestamp(),
            });
            
            return { status: 200, message: 'Move made successfully' };
        }
    },

    async HandleGameMove(sender: string, shortcode: string, col: number): Promise<ServiceResponse> {
        // Create fresh game context to manage all game data
        const gameContext = await GameContext.fromShortcode(sender, shortcode);
        return await this.HandleGameMoveWithContext(gameContext, col);
    },


    async HandleGameOver (gameId: string, state: number): Promise<void> {
        // check that the game exists in redis

        const r = await redisOps();
        // update the game state in redis
        await r.game.updateGameMetadataState(gameId, state);

        // Invalidate any cached GameContext data since game state changed
        // Note: In a real implementation, you might want to notify specific users
        // For now, we'll just update the state and let future GameContext calls refresh

        // end by starting a job to store the game from gameService
        // gameService.StoreGame(gameId);
    },


    async HandleDrawOfferWithContext(gameContext: GameContext): Promise<ServiceResponse> {
        // Validate player is in the game room with fresh data
        gameContext.invalidatePlayerData();
        await gameContext.validatePlayerInRoom();
        
        // Get fresh metadata to check game state
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata || !gameContext.gameId) {
            return { status: 404, message: 'Game metadata not found' };
        }

        // if game state is ended do nothing
        // TODO: Add proper game state checks
        
        // TODO: Implement draw offer logic with Redis operations
        // For now, return a placeholder response
        return { status: 200, message: 'Draw offer handled' };
    },

    async HandleDrawOffer(sender: string, shortcode: string): Promise<ServiceResponse> {
        // Create fresh game context to manage all game data
        const gameContext = await GameContext.fromShortcode(sender, shortcode);
        return await this.HandleDrawOfferWithContext(gameContext);
    }




}