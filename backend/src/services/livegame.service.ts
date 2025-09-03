import { getSocketIO } from "@/controllers/socket";
import { redisOps } from "@/redis/ops";
import { replaceProfanities } from 'no-profanity'
import { gameService } from "./game.service";
import { RoomSchema } from "@/controllers/socket/socketRoomSchema";
import { ServiceResponse } from "@/types/custom";
import { TimedStandardGame } from "@shared/utils/Games/timed-game";
import { GameInfo } from "@shared/types/game.types";
import { ChatMessage } from "@shared/types/Websocket";
import { userService } from "./user.service";
import { parseUser } from "@/utils/validation";
import { GameContext } from "@/utils/gameContext";
import { GameState } from "@shared/constants/allgamestates";
import { StandardModes } from "@shared/utils/gamemodes";
import { getGameTimeoutQueue, JobSets } from "@/jobs";
import { JobKeys } from "@/jobs/jobKeys";
import { GameNotFound } from "@/types/miscErrors";

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

        try {
            await gameContext.validatePlayerInRoom();
        } catch (error) {
            if (!(error instanceof GameNotFound)) {
                console.error("Player is not in the game room, skipping disconnection logic", error);
            }
            return; // Player is not in the game room, skip disconnection logic
        }

        if (!gameContext.gameId || !gameContext.userId) {
            console.error("Game ID or User ID is missing for resetting disconnect job");
            return;
        }

        // send disconnect signal
        const socket = getSocketIO();
        socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:disconnect', {
            player: gameContext.getPlayerIndex()
        });

        const jobId = JobKeys.game_disconnect.stringId(gameContext.userId, gameContext.gameId);
        // only add the job if it does not exist
        const existingJob = await JobSets.getGameDisconnectionQueue().getJob(jobId);
        if (!existingJob) {
            console.log("------- CREATED DISCONNECTION JOB -------");
            await JobSets.getGameDisconnectionQueue().add(
                "game_disconnect", // Job name (can be generic)
                {
                    gameId: gameContext.gameId,
                    playerId: gameContext.userId,
                },
                {
                    jobId: jobId, // Explicitly set the job ID
                    delay: 30000,
                }
            );
        }
    },

    async dropDisconnectJob(gameContext: GameContext): Promise<void> {
        // Reset the disconnect job for the game
        try {
            await gameContext.validatePlayerInRoom();
        } catch (error) {
            if (!(error instanceof GameNotFound)) {
                console.error("Player is not in the game room, skipping disconnection logic", error);
            }
            return; // Player is not in the game room, skip disconnection logic
        }
        if (!gameContext.gameId || !gameContext.userId) {
            console.error("Game ID or User ID is missing for resetting disconnect job");
            return;
        }

        const jobId = JobKeys.game_disconnect.stringId(gameContext.userId, gameContext.gameId);
        const job = await JobSets.getGameDisconnectionQueue().getJob(jobId);
        if (job) {
            console.log(`❌ Canceled game disconnection job with ID: ${jobId}`);
            await job.remove();

            // send reconnect signal
            const socket = getSocketIO();
            socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:reconnect', {
                player: gameContext.getPlayerIndex()
            });

        } else {
            console.log(`⚠️ Job ${jobId} not found - may have already completed or been removed`);
        }
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

        const draws = timedata.drawOffer!;

        draws[playerIndex] = true;

        if (draws.every((d: boolean) => d)) {
            await this.HandleGameOver(gameContext, GameState.AGREED_DRAW);
        } else {
            // update the draw offer in Redis
            const r = await redisOps();
            await r.game.updateGameTimedata(gameContext.gameId!, { drawOffer: draws });

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
        const metadata = await gameContext.getMetadata();
        if (!metadata || !gameContext.gameId || !playerIndex) return;

        await gameContext.validatePlayerInRoom();

        // if game state is not in progress do nothing
        if (metadata.state !== GameState.IN_PROGRESS) return;

        // check for timeouts first
        const response = await this.checkGameHealth(gameContext);
        if (response.status !== 200) {
            console.log("Game ended by resign or something else.", response.message);
            return; // if the game is already over, do nothing
        }

        if (StandardModes.has(metadata.gamemode)) {
            // Handle game end here
            let result;
            if (playerIndex === 0) {
                result = GameState.RED_RESIGNED;
            } else {
                result = GameState.YELLOW_RESIGNED;
            }
            this.HandleGameOver(gameContext, result);
        } else {
            // Handle other game modes
            console.error("Unsupported game mode for resignation");
            return;
        }
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
        const user = await userService.GetUserByID(parseUser(gameContext.userId));
        
        const playerIndex = await gameContext.getPlayerIndex();
        const color = playerIndex === 0 ? 'red' : 'yellow';

        // send the message to the opponent
        const socket = getSocketIO();
        socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:chat', {
            username: user.username,
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
        const { metadata, timedata: gameTimes } = await gameContext.getAllGameData();
        
        if (!gameTimes || !metadata || !gameContext.gameId) {
            return { status: 404, message: 'Game metadata not found' };
        }

        // check the sender is the current player with fresh data
        if (!(await gameContext.isCurrentPlayerTurn())) {
            return { status: 403, message: 'Not your turn' };
        }

        const Game = await this.loadTimedGame(gameContext);
        if (!Game) {
            return { status: 404, message: 'Game not found' };
        }
        
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

        if (!Game.hasTimedOutPlayer()) {
            
            // handle the move in redis
            await r.game.addGameMove(gameContext.gameId, col);
            
            // Update cached moves in context
            gameContext.addMoveToCache(col);

            // cancel outstanding game draw offers
            await r.game.cancelGameDrawOffer(gameContext.gameId);
            const tl = Game.getTimeLeft();
            const cp = Game.currentPlayer;
            console.log("AFTER ADDING MOVES", gameContext.gameId,
                deltaTime,
                cp,
                tl as [number, number],
                Game.getLastMoveTimestamp());
                
            // update the game times
            await r.game.updateGameTimeAfterMove(
                gameContext.gameId,
                deltaTime,
                cp,
                tl as [number, number],
                Game.getLastMoveTimestamp(),
            );

            // set job for game timeout based on new current player time left
            const delay = tl[cp] + 100
            const jobId = JobKeys.game_timeout.stringId(gameContext.userId!, gameContext.gameId);
            await getGameTimeoutQueue().add(
                jobId, { userId: gameContext.userId, gameId: gameContext.gameId }, { delay });

            gameContext.invalidateTimedata();

            // broadcast the move to the game room
            const socket = getSocketIO();
            socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:move', {
                col,
                row: result.row,
                player: gameTimes.cTurn,
                rTimes: Game.getTimeLeft(),
                lMove: Game.getLastMoveTimestamp(),
            });
        } else {
            // update the game times
            await r.game.updateGameTimedata(
                gameContext.gameId,
                {
                    rTimes: Game.getTimeLeft(),
                    cTurn: Game.currentPlayer,
                }
            );
        }

        if (Game.isGameOver()) {
            // handle game over logic
            await this.HandleGameOver(gameContext, Game.getGameState());
            return { status: 200, message: 'Game over' };
        }

        return { status: 200, message: 'Move made successfully' };
    
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
        
        const metadata = await gameContext.getMetadata();
        const timedata = await gameContext.getTimedata();
        if (!metadata || !timedata) {
            throw new Error('Game metadata not found');
        }
        await gameContext.validatePlayerInRoom();
        
        if (metadata.state !== GameState.IN_PROGRESS)
            return; // if game state is not in progress, do nothing
        
        
        await r.game.updateGameMetadataState(gameContext.gameId, state);
    
        // Notify all players about the game over
        const socket = getSocketIO();
        socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:over', {
            result: state,
            finalTimes: timedata.rTimes,
        });

        // Free the players of the game
        await this.FreeGamePlayers(gameContext);

        // end by storing the game to NOSQL

    },

    async loadTimedGame(gameContext: GameContext): Promise<TimedStandardGame | null> {
        // create the game object
        const { metadata: gameMeta, timedata: gameTimes, moves } = await gameContext.getAllGameData();
        if (!gameTimes || !gameMeta || !gameContext.gameId) {
            console.error("Failed to load timed game: missing game data");
            return null;
        }
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
        if (!Game) {
            console.error("Failed to load timed game");
            return null;
        }
        return Game;
    },



    async FreeGamePlayers(gameContext: GameContext): Promise<void> {
        
        // Get fresh metadata to check game state
        gameContext.invalidateMetadata();
        const gameId = await gameContext.resolveGameId();
        const metadata = await gameContext.getMetadata();
        if (!metadata || !gameId) return;

        // if the game state is not scheduled then do nothing
        if (metadata.state !== GameState.SCHEDULED) return;

        // free up the players of the game
        metadata.players.forEach(async (player) => {
            console.log("FREEING PLAYER", player, gameId);
            const playerContext = await GameContext.fromGameId(player, gameId);
            await gameService.QuitPlayerQueue(playerContext);
        });

    },



    async checkGameHealth(gameContext: GameContext): Promise<ServiceResponse> {
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
            return { status: 400, message: `Game is currently in state: ${metadata.state}` };
        }

        const Game = await this.loadTimedGame(gameContext);
        if (!Game) {
            return { status: 404, message: 'Timed game not found' };
        }

        // Check if the current player has timed out
        if (Game.checkPlayerTimeOut()) {
            // Handle game over due to timeout
            await this.HandleGameOver(gameContext, Game.getGameState());
            return { status: 100, message: 'Player has timed out' };
        }

        // If no timeout, return successfully
        return { status: 200, message: 'Game is in progress' };
    },



    async isPlayerSocketConnected(uIdentity: string): Promise<boolean> {
        const socket = getSocketIO();
        const playerSocket = socket?.sockets?.sockets.get(RoomSchema.user.key(uIdentity));
        
        if (playerSocket) {
            // check if the socket is still connected
            return playerSocket.connected;
        }
        
        return false;
    },



    async DisconnectPlayer(gameContext: GameContext): Promise<void> {
        const playerId = gameContext.userId;
        const gameId = gameContext.gameId;
        if (!playerId || !gameId) {
            console.error("Player ID or Game ID is missing for disconnection");
            return;
        } 
        await gameContext.validatePlayerInRoom();   
        const isConnected = await this.isPlayerSocketConnected(playerId);
        if (isConnected) {
          // The player has reconnected, so we can skip the disconnection logic
          console.log(`Player ${playerId} has reconnected, skipping disconnection logic.`);
          return;
        }

        // The player is disconnected, so we can proceed with the disconnection logic
        const playerNumber = await gameContext.getPlayerIndex()!;
        const gameMeta = await gameContext.getMetadata();
        if (!playerNumber || !gameMeta) {
            console.error("Player number or game metadata is missing for disconnection");
            return;
        }

        if (StandardModes.has(gameMeta.gamemode)) {
            // Handle game end here
            await this.HandleGameOver(gameContext,
                playerNumber === 0 ? GameState.RED_DISCONNECTED : GameState.YELLOW_DISCONNECTED
            );
            return;
        } else {
            // Handle other game modes
            console.error("Unsupported game mode for disconnection");
            return;
        }
    },


    async ManageBotMove(gameId: string): Promise<void> {

        // use redis to get the game meta and time data from the gameId and get the current player ID and check its a bot.


        // const botId = gameContext.userId;
        // if (!botId || !gameId) {
        //     console.error("Bot ID or Game ID is missing for managing bot move");
        //     return;
        // }

        // // Implement bot move logic here
        // console.log(`Managing bot move for Bot ID: ${botId}, Game ID: ${gameId}`);
    }






}