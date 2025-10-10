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
import { parseUser, isBotIdentity, getIdentity } from "@/utils/validation";
import { GameContext } from "@/utils/gameContext";
import { GameState } from "@shared/constants/allgamestates";
import { StandardModes } from "@shared/utils/gamemodes";
import { getGameTimeoutQueue, getGameDisconnectionQueue } from "@/jobs";
import { JobKeys } from "@/jobs/jobKeys";
import { GameNotFound } from "@/types/miscErrors";
import { getBotById } from "@/tools/Bots";

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
        console.log(`[🤖 BOT DEBUG] handleDisconnect called for user ${gameContext.userId}`);

        try {
            await gameContext.validatePlayerInRoom();
            console.log(`[🤖 BOT DEBUG] User ${gameContext.userId} validated in room`);
        } catch (error) {
            if (!(error instanceof GameNotFound)) {
                console.error("Player is not in the game room, skipping disconnection logic", error);
            } else {
                console.log(`[🤖 BOT DEBUG] User ${gameContext.userId} not in any game room, returning`);
            }
            return; // Player is not in the game room, skip disconnection logic
        }

        if (!gameContext.gameId || !gameContext.userId) {
            console.error("Game ID or User ID is missing for resetting disconnect job");
            return;
        }

        // BOT LOGIC: Check if this game has any bot players - if so, immediately resign instead of allowing reconnection
        const metadata = await gameContext.getMetadata();
        console.log(`[🤖 BOT DEBUG] Game metadata:`, { gameId: gameContext.gameId, gamemode: metadata?.gamemode, players: metadata?.players });

        if (metadata && metadata.players.some(p => {
            if (!p) throw new Error("Player not found");
            else return isBotIdentity(p);
        })) {
            console.log(`[🤖 BOT GAME] Player disconnected from game with bot players ${gameContext.gameId}, forcing resignation`);
            
            // Get player index for resignation
            const playerIndex = await gameContext.getPlayerIndex();
            if (playerIndex !== null) {
                console.log(`[🤖 BOT GAME] Executing resignation for player ${playerIndex} in game ${gameContext.gameId}`);
                // Immediately end the game with player resignation
                await this.HandleGameOver(gameContext, 
                    playerIndex === 0 ? GameState.RED_RESIGNED : GameState.YELLOW_RESIGNED
                );
                console.log(`[🤖 BOT GAME] Resignation completed for game ${gameContext.gameId}`);
            }
            return; // No reconnection allowed in games with bots
        }

        // send disconnect signal
        const socket = getSocketIO();
        socket.to(RoomSchema.game.key(gameContext.shortcode!)).emit('game:disconnect', {
            player: gameContext.getPlayerIndex()
        });

        const jobId = JobKeys.game_disconnect.stringId(gameContext.userId, gameContext.gameId);
        // only add the job if it does not exist
        const existingJob = await getGameDisconnectionQueue().getJob(jobId);
        if (!existingJob) {
            console.log("------- CREATED DISCONNECTION JOB -------");
            await getGameDisconnectionQueue().add(
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
        const job = await getGameDisconnectionQueue().getJob(jobId);
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
        const response = await this.checkTimeOuts(gameContext);
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

        // After successful move, check if next player is a bot and trigger bot move (reusable across all game modes)
        // TODO: Future proof this part for other game modes, events etc...
        
        if (!StandardModes.has(metadata.gamemode)) {
            console.log(`[🤖 BOT DEBUG] Game mode ${metadata.gamemode} does not support bot moves, skipping bot check`)
            return { status: 200, message: 'Move made successfully' };
        }

        // We need to check the opponent after the current move
        const opponentUserId = await gameContext.get2PlayerOpponentUserId();
        
        console.log(`[🤖 BOT DEBUG] Checking if next player is bot:`, {
            opponentUserId,
            isBot: opponentUserId ? isBotIdentity(opponentUserId) : false,
            gameId: gameContext.gameId
        });
        
        if (opponentUserId && isBotIdentity(opponentUserId)) {
            console.log(`[🤖 BOT TRIGGER] Next player ${opponentUserId} is a bot, triggering bot move`);
            // Trigger bot move asynchronously with a small delay to ensure state is consistent
            setTimeout(async () => {
                try {
                    console.log(`[🤖 BOT TRIGGER] Executing delayed bot move for ${opponentUserId}`);
                    await this.ManageBotMove(gameContext.gameId!);
                } catch (error) {
                    console.error(`[🤖 BOT ERROR] Error triggering bot move for ${opponentUserId}:`, error);
                }
            }, 100);
        } else {
            console.log(`[🤖 BOT DEBUG] Next player is not a bot, no bot move needed`);
        }

        return { status: 200, message: 'Move made successfully' };
    
    },

    async HandleGameOver (gameContext: GameContext, state: number): Promise<void> {
        console.log(`[🏁 GAME END] === HandleGameOver started ===`);
        console.log(`[🏁 GAME END] Game ID: ${gameContext.gameId}, State: ${state}`);
        
        const r = await redisOps();

        if (!gameContext.gameId) {
            console.error(`[🏁 GAME END ERROR] Game ID is null`);
            throw new Error('Game ID is null');
        }
        
        const metadata = await gameContext.getMetadata();
        const timedata = await gameContext.getTimedata();
        
        console.log(`[🏁 GAME END] Game data retrieved:`, {
            gameId: gameContext.gameId,
            hasMetadata: !!metadata,
            hasTimedata: !!timedata,
            currentState: metadata?.state,
            players: metadata?.players,
            shortcode: gameContext.shortcode
        });
        
        if (!metadata || !timedata) {
            console.error(`[🏁 GAME END ERROR] Game metadata or timedata not found`);
            throw new Error('Game metadata not found');
        }
        
        await gameContext.validatePlayerInRoom();
        console.log(`[🏁 GAME END] Player validated in room`);
        
        if (metadata.state !== GameState.IN_PROGRESS) {
            console.log(`[🏁 GAME END] Game not in progress (state: ${metadata.state}), skipping`);
            return; // if game state is not in progress, do nothing
        }
        
        console.log(`[🏁 GAME END] Updating game state from ${metadata.state} to ${state}`);
        await r.game.updateGameMetadataState(gameContext.gameId, state);
        console.log(`[🏁 GAME END] Game state updated successfully`);
    
        // Notify all players about the game over
        const socket = getSocketIO();
        const roomKey = RoomSchema.game.key(gameContext.shortcode!);
        console.log(`[🏁 GAME END] Emitting game:over to room ${roomKey}`);
        
        socket.to(roomKey).emit('game:over', {
            result: state,
            finalTimes: timedata.rTimes,
        });
        console.log(`[🏁 GAME END] Game over event emitted successfully`);

        // Free the players of the game
        console.log(`[🏁 GAME END] Starting player cleanup`);
        await this.FreeGamePlayers(gameContext);
        console.log(`[🏁 GAME END] Player cleanup completed`);

        console.log(`[🏁 GAME END] === HandleGameOver completed ===`);
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
        console.log(`[🔓 PLAYER CLEANUP] === FreeGamePlayers started ===`);
        
        // Get fresh metadata to check game state
        gameContext.invalidateMetadata();
        const gameId = await gameContext.resolveGameId();
        const metadata = await gameContext.getMetadata();
        
        console.log(`[🔓 PLAYER CLEANUP] Game data:`, {
            gameId,
            hasMetadata: !!metadata,
            state: metadata?.state,
            players: metadata?.players,
            playerCount: metadata?.players?.length
        });
        
        if (!metadata || !gameId) {
            console.log(`[🔓 PLAYER CLEANUP] Missing metadata or gameId, skipping cleanup`);
            return;
        }

        // if the game state is in progress then we can not free players
        if (metadata.state === GameState.IN_PROGRESS) {
            console.log(`[🔓 PLAYER CLEANUP] Game still in progress, skipping player cleanup`);
            return;
        }

        console.log(`[🔓 PLAYER CLEANUP] Starting cleanup for ${metadata.players.length} players`);
        
        // free up the players of the game - use Promise.all to handle async operations properly
        const cleanupPromises = metadata.players.map(async (player, index) => {
            try {
                console.log(`[🔓 PLAYER CLEANUP] Freeing player ${index + 1}/${metadata.players.length}: ${player}`);
                if (player !== null && !isBotIdentity(player)) {
                    const playerContext = await GameContext.fromGameId(player, gameId);
                    await gameService.QuitPlayerQueue(playerContext);

                    console.log(`[🔓 PLAYER CLEANUP] ✅ Successfully freed player ${player}`);
                }
            } catch (error) {
                console.error(`[🔓 PLAYER CLEANUP ERROR] Failed to free player ${player}:`, error);
            }
        });
        
        await Promise.all(cleanupPromises);
        console.log(`[🔓 PLAYER CLEANUP] === FreeGamePlayers completed ===`);

    },



    async checkTimeOuts(gameContext: GameContext): Promise<ServiceResponse> {
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
        console.log(`[🤖 BOT DEBUG] === ManageBotMove started for game ${gameId} ===`);
        try {
            const r = await redisOps();
            
            // Get game metadata and timedata
            console.log(`[🤖 BOT DEBUG] Fetching game data for ${gameId}`);
            const metadata = await r.game.getGameMetadata(gameId);
            const timedata = await r.game.getGameTimes(gameId);
            
            if (!metadata || !timedata) {
                console.error(`[🤖 BOT ERROR] Game metadata or timedata not found for bot move ${gameId}`);
                console.error(`[🤖 BOT ERROR] Metadata:`, metadata, `Timedata:`, timedata);
                return;
            }

            console.log(`[🤖 BOT DEBUG] Game data retrieved:`, { 
                gameId, 
                state: metadata.state, 
                gamemode: metadata.gamemode,
                players: metadata.players,
                currentTurn: timedata.cTurn 
            });

            // Check if game is in progress
            if (metadata.state !== GameState.IN_PROGRESS) {
                console.log(`[🤖 BOT DEBUG] Game not in progress, skipping bot move. Game ${gameId} state: ${metadata.state}`);
                return;
            }

            // Get current player's userId
            const currentPlayerIndex = timedata.cTurn;
            const currentPlayerId = metadata.players[currentPlayerIndex];
            
            console.log(`[🤖 BOT DEBUG] Current turn analysis:`, {
                currentPlayerIndex,
                currentPlayerId,
                allPlayers: metadata.players,
                playerIsBot: currentPlayerId ? isBotIdentity(currentPlayerId) : 'unknown'
            });
            
            if (!currentPlayerId) {
                console.error(`[🤖 BOT ERROR] Current player ID not found. Game ${gameId}, turn index ${currentPlayerIndex}`);
                console.error(`[🤖 BOT ERROR] Available players:`, metadata.players);
                return;
            }

            // Check if current player is a bot
            if (!isBotIdentity(currentPlayerId)) {
                console.log(`[🤖 BOT DEBUG] Current player ${currentPlayerId} is not a bot, skipping bot move`);
                return;
            }

            // Extract bot ID from identity
            const identity = getIdentity(currentPlayerId);
            const botId = identity.bot;
            console.log(`[🤖 BOT DEBUG] Bot identity extracted:`, {
                currentPlayerId,
                identity,
                botId
            });
            
            if (!botId) {
                console.error(`[🤖 BOT ERROR] Bot ID could not be extracted from ${currentPlayerId}`);
                console.error(`[🤖 BOT ERROR] Identity object:`, identity);
                return;
            }

            console.log(`[🤖 BOT MOVE] === Managing bot move for Bot ID: ${botId}, Game ID: ${gameId} ===`);

            // Load the timed game to get current state
            console.log(`[🤖 BOT DEBUG] Creating game context for bot ${botId}`);
            const gameContext = await GameContext.fromGameId(currentPlayerId, gameId);
            const Game = await this.loadTimedGame(gameContext);
            if (!Game) {
                console.error(`[🤖 BOT ERROR] Failed to load timed game for bot ${botId} in game ${gameId}`);
                return;
            }

            console.log(`[🤖 BOT DEBUG] Game state loaded:`, {
                gameId,
                botId,
                isGameOver: Game.isGameOver(),
                gameState: Game.getGameState(),
                legalMoves: Game.getLegalMoves()
            });

            // Check if game is already over
            if (Game.isGameOver()) {
                console.log(`[🤖 BOT DEBUG] Game ${gameId} is already over, skipping bot move for ${botId}`);
                return; 
            }

            // Get the bot implementation and make a move
            console.log(`[🤖 BOT MOVE] Getting bot implementation for ${botId}`);
            try {
                const bot = getBotById(botId, Game);
                console.log(`[🤖 BOT DEBUG] Bot ${botId} implementation loaded successfully`);
                
                const startTime = Date.now();
                const botMove = await bot.chooseMove();
                const moveTime = Date.now() - startTime;
                
                console.log(`[🤖 BOT MOVE] Bot ${botId} chose move ${botMove} in ${moveTime}ms`);

                // Validate the move is legal
                const legalMoves = Game.getLegalMoves();
                console.log(`[🤖 BOT DEBUG] Legal moves available:`, legalMoves);
                
                if (!legalMoves.includes(botMove)) {
                    console.error(`[🤖 BOT ERROR] Bot ${botId} chose ILLEGAL move ${botMove}`);
                    console.error(`[🤖 BOT ERROR] Legal moves were:`, legalMoves);
                    console.error(`[🤖 BOT ERROR] Game state:`, Game.getGameState());
                    
                    // Fallback to first legal move
                    const fallbackMove = legalMoves[0];
                    if (fallbackMove !== undefined) {
                        console.log(`[🤖 BOT FALLBACK] Using first legal move: ${fallbackMove}`);
                        await this.HandleGameMove(gameContext, fallbackMove);
                        console.log(`[🤖 BOT FALLBACK] Fallback move ${fallbackMove} executed successfully`);
                    } else {
                        console.error(`[🤖 BOT ERROR] No legal moves available! Game might be over.`);
                    }
                    return;
                }

                // Execute the bot's move
                console.log(`[🤖 BOT MOVE] Executing bot move ${botMove} for ${botId}`);
                await this.HandleGameMove(gameContext, botMove);
                console.log(`[🤖 BOT MOVE] ✅ Bot move ${botMove} executed successfully for ${botId}`);
                
            } catch (botError) {
                console.error(`[🤖 BOT ERROR] Error getting bot or making move for ${botId}:`, botError);
                if (botError instanceof Error) {
                    console.error(`[🤖 BOT ERROR] Error stack:`, botError.stack);
                }
                
                // Fallback: make a random legal move
                const legalMoves = Game.getLegalMoves();
                console.log(`[🤖 BOT FALLBACK] Attempting random fallback move. Legal moves:`, legalMoves);
                
                if (legalMoves.length > 0) {
                    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                    console.log(`[🤖 BOT FALLBACK] Making random move ${randomMove} for ${botId}`);
                    try {
                        await this.HandleGameMove(gameContext, randomMove);
                        console.log(`[🤖 BOT FALLBACK] ✅ Random move ${randomMove} executed successfully`);
                    } catch (fallbackError) {
                        console.error(`[🤖 BOT ERROR] Even fallback move failed:`, fallbackError);
                    }
                } else {
                    console.error(`[🤖 BOT ERROR] No legal moves available for fallback!`);
                }
            }

        } catch (error) {
            console.error(`[🤖 BOT ERROR] Critical error in ManageBotMove for game ${gameId}:`, error);
            if (error instanceof Error) {
                console.error(`[🤖 BOT ERROR] Error stack:`, error.stack);
            }
        }
        
        console.log(`[🤖 BOT DEBUG] === ManageBotMove completed for game ${gameId} ===`);
    }






}