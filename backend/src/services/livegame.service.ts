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
import { GameState } from "@shared/constants/allgamestates";

export const liveGameService = {
    

    async AbortGame(gameContext: GameContext): Promise<void> {
        // Get fresh metadata to check game status
        const r = await redisOps();

        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) return;

        // also get the game id data
        const gameId = await gameContext.resolveGameId();
        if (!gameId) return;
        
        // if the game state is not scheduled then do nothing
        if (metadata.state !== GameState.SCHEDULED) return;

        // move the game state to aborted
        await r.game.updateGameMetadataState(gameId, GameState.ABORTED);

        // free up the players of the game
        await this.FreeGamePlayers(gameContext);

    },

    async handleDisconnect(gameContext: GameContext): Promise<void> {

        console.log("ATTEMPTING DISCONNECT HANDLER", gameContext.userId, gameContext.shortcode);

        const socket = getSocketIO();
        
        
        // send message to the game room


        // start a job to handle the disconnect


    },

    async HandleDraw(gameContext: GameContext): Promise<void> {
        // Get fresh game data
        gameContext.invalidateAll();
        
        const playerIndex = await gameContext.getPlayerIndex();
        if (playerIndex === null) return; // user is not in the game
        
        const metadata = await gameContext.getMetadata();
        if (!metadata) return;
        
        // if game state is not in progress do nothing
        if (metadata.state !== GameState.IN_PROGRESS) return;

        const timedata = await gameContext.getTimedata();
        if (!timedata) return;

        const draws = timedata.draws!;

        draws[playerIndex] = true;

        if (draws.every((d: boolean) => d)) {
            await this.HandleGameOver(gameContext, GameState.AGREED_DRAW);
        } else {
            // update the draw offer in Redis
            const r = await redisOps();
            await r.game.updateGameTimedata(gameContext.gameId!, { draws });

            // notify the players about the draw offer
            const socket = getSocketIO();
            socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:draw', {
                player: playerIndex
            });
        }

    },

    async Resign(gameContext: GameContext): Promise<void> {
        // Get fresh game data
        gameContext.invalidateAll();
        const playerIndex = await gameContext.getPlayerIndex();
        if (playerIndex === null) return; // user is not in the game

        let result = GameState.ERRORED;
        if (playerIndex === 0) {
            result = GameState.RED_RESIGNED;
        } else {
            result = GameState.YELLOW_RESIGNED;
        }

        this.HandleGameOver(gameContext, result);
    },

    async HandleChatMessage(gameContext: GameContext, message: string): Promise<void> {
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
        const username = await userService.GetUserByID(parseUser(gameContext.userId));
        
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

    async HandleGameMove(gameContext: GameContext, col: number): Promise<ServiceResponse> {
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
            await this.HandleGameOver(gameContext, Game.getGameState());
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

    async HandleGameOver (gameContext: GameContext, state: number): Promise<void> {
        // check that the game exists in redis
        // Invalidate any cached GameContext data since game state changed
        // Note: In a real implementation, you might want to notify specific users
        // For now, we'll just update the state and let future GameContext calls refresh

        const r = await redisOps();
        console.log("HANDLING GAME OVER", gameContext.gameId, state);

        if (!gameContext.gameId) {
            throw new Error('Game ID is null');
        }
        
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) {
            throw new Error('Game metadata not found');
        }
        await gameContext.validatePlayerInRoom();
        
        if (metadata.state !== GameState.IN_PROGRESS)
            return; // if game state is not in progress, do nothing
        
        
        await r.game.updateGameMetadataState(gameContext.gameId, state);
    
        // Notify all players about the game over

        // Free the players of the game
        await this.FreeGamePlayers(gameContext);

        // end by storing the game to NOSQL

    },


    async HandleDrawOffer(gameContext: GameContext): Promise<ServiceResponse> {
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


        // end by starting a job to store the game from gameService
        // gameService.StoreGame(gameContext);

        return { status: 200, message: 'Draw offer handled' };
    },



    async FreeGamePlayers(gameContext: GameContext): Promise<void> {
        
        // Get fresh metadata to check game state
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata || !gameContext.gameId) return;

        // if the game state is not scheduled then do nothing
        if (metadata.state !== GameState.SCHEDULED) return;

        // free up the players of the game
        const r = await redisOps();
        metadata.players.forEach(async (player) => {
            await r.game.leaveUserQueue(player);
        });

    },



    async GetStatus(gameContext: GameContext): Promise<ServiceResponse> {
        // Validate player is in the game room with fresh data
        gameContext.invalidatePlayerData();
        await gameContext.validatePlayerInRoom();

        // Get fresh metadata to check game state
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata || !gameContext.gameId) {
            return { status: 404, message: 'Game metadata not found' };
        }

        // if game state is not in progress, return the current state
        if (metadata.state !== GameState.IN_PROGRESS) {
            return { status: 200, message: `Game is currently in state: ${metadata.state}` };
        }

        // here we verify that neither player has disconnected for more than 30 seconds
        // and that neither player has timed out of the game

        return { status: 500, message: 'Game is in progress' };
    },


}