import { dynamoDBOps } from "@/db/dynamodb/ops";
import { redisOps } from "@/redis/ops";
import { ServiceResponse } from "@/types/custom";
import { EloChange, GameInfo, GameSetupParams, TimeControl } from "@shared/types/game.types";
import { CasualModes, CompetitiveModes, StandardModes } from "@shared/utils/gameinfo";
import { packGameInfo, packStandardGameData, uuidToBuffer } from "@/utils/binary";
import { GameState } from "@shared/constants/allgamestates";
import { FinishedGameStates } from "@shared/utils/gamestates";
import { addToPlayerList, calculateEloChanges, gameinfoFromMeta } from "@/utils/game";
import { generateUUID } from "@/utils/auth";
import { GameMetadata, GameMetadataSchema, UserQueue } from "@/redis/redisSchema";
import { isUserIdentity, makeUserIdentity, parseUser, makeBotIdentity, isBotIdentity } from "@/utils/validation";
import { getSocketIO } from "@/controllers/socket";
import { userService } from "./user.service";
import { AllGameModes, GameMode, t_GameMode } from "@shared/constants/allgamemodes";
import { ErrorCode, ShortcodeGameLink, createErrorResponse } from "@shared/constants/errorCodes";
import { RoomSchema } from "@/controllers/socket/socketRoomSchema";
import { GameContext } from "@/utils/gameContext";
import { PlayAs } from "@shared/types/game.types";
import { UUID } from "crypto";
import { StandardGameMetadata } from "@shared/types/Websocket";
import { PlayerData } from "@shared/types/users";
import { STANDARD_MAX_PLAYERS } from "@shared/constants/game.constants";

export const gameService = {

    /* Function to assert that a user is not already in a game or queue */
    async assertUserGame (gameContext: GameContext): Promise<ServiceResponse> {
        const r = await redisOps();

        // check if user is already in a game or in a queue
        const gameId = await gameContext.resolveGameId();
        console.log("User is in game with ID:", gameId);
        if (gameId) {
            try {
                const existingGameContext = await GameContext.fromGameId(gameContext.userId, gameId);
                const metadata = await existingGameContext.getMetadata();
                
                console.log("Game found with metadata:", metadata);
                if (!metadata) {
                    return { status: 500, message: 'Game Error - no metadata found' };
                }
                let redirect = '';
                if (metadata.gamemode === GameMode.STANDARD_BOT_MATCH || StandardModes.has(metadata.gamemode)) {
                    redirect = ShortcodeGameLink(metadata.shortcode ?? "");
                }
                if (metadata.state === GameState.IN_PROGRESS) {
                    return { status: 409, message: ErrorCode.ALREADY_IN_GAME, redirect };
                } else if (metadata.state === GameState.SCHEDULED) {
                    return { status: 409, message: ErrorCode.ALREADY_IN_QUEUE, redirect };
                }
            } catch (error) {
                console.error('Error getting game metadata:', error);
                return { status: 500, message: ErrorCode.SERVER_ERROR };
            }

            await r.game.leaveUserQueue(gameContext.userId); // clean up stale queue entry
        }
        return { status: 200, message: 'User not in a game' };
    },
  
    /**
     * Function called to begin matchmaking for a user. If a match is found, it will return the game ID. If not, user will be added to redis queue.
     */
    async joinGameQueue (gameContext: GameContext, gameparams: GameSetupParams): Promise<ServiceResponse> {

        const { gamemode, time_control, botId, playerColor } = gameparams;

        // invariant, the user is NOT in a game or queue already - checked in middleware
        // invariant, time_control is validated beforehand
        
        // Validate mode and prepare game info
        const isBotGame = gamemode === GameMode.STANDARD_BOT_MATCH;
        const isCasualGame = CasualModes.has(gamemode);
        
        if (CompetitiveModes.has(gamemode)) {
            return { status: 404, message: 'Not Implemented Yet' };
        }
        if (!isBotGame && !isCasualGame) {
            return { status: 400, message: 'Invalid Game Mode' };
        }

        try {
            const r = await redisOps();

            // Determine time control based on game type
            const effectiveTimeControl = isBotGame 
                ? { base_time: 180, increment: 2, disadvantage: 10 } // default time control for bot games for now
                : time_control!;

            const gameInfo = { gamemode, time_control: effectiveTimeControl };

            // Add user to queue
            await r.game.addOrUpdateUserGameQueue(gameContext.userId, {
                gameinfo: packGameInfo(gameInfo),
                timeAdded: Date.now(),            
            } as UserQueue);
            console.log(`User ${gameContext.userId} added to ${isBotGame ? 'bot' : 'casual'} queue for game mode ${gamemode}`);

            // Create game with shortcode
            const gameMeta = await this.CreateGame(gameInfo, true);
            
            // Create new GameContext and assign player
            const newGameContext = await GameContext.fromGameId(gameContext.userId, gameMeta.id);
            await this.AssignPlayerToGame(newGameContext, null, playerColor);

            // Bot-specific logic: add bot to empty slot
            if (isBotGame) {
                const botIdentity = makeBotIdentity(botId as UUID);
                const players = (await newGameContext.getMetadata())!.players;
                const botPlayerList = addToPlayerList(players, botIdentity, PlayAs.FIT_IN);
                await r.game.updateGameMetadata(gameMeta.id, { players: botPlayerList });
            }

            return { status: 200, message: gameMeta.shortcode! };
            
        } catch (error) {
            console.error(`Error creating ${isBotGame ? 'bot' : 'casual'} game:`, error);
            return { status: 500, message: `Failed to create ${isBotGame ? 'bot' : 'casual'} game` };
        }
    },

    /**
     * Function called to quit the matchmaking queue for a user.
     */
    async QuitPlayerQueue (gameContext: GameContext): Promise<void> {
        console.log("Safely quitting game queue for user:", gameContext.userId);
        const r = await redisOps();
        const gameId = await gameContext.resolveGameId();
        if (gameId) {
            
            const metadata = await gameContext.getMetadata();
            
            if (metadata) {
                if (metadata.state === GameState.IN_PROGRESS) {
                    throw new Error(ErrorCode.CANNOT_LEAVE_ACTIVE_GAME);
                }
            }
            
            await r.game.leaveUserQueue(gameContext.userId);
            return;
        } else {
            return;
        }
    },

    /**
     * Function called to create any type of game with the given gamemode and time control.
     * @param gamemode 
     * @param time_control 
     * @returns game UUID in redis
     */
    async CreateGame (gameinfo: GameInfo, needShortCode: boolean): Promise<GameMetadata & { id: string }> {

        // create a new game with the given gamemode and time control
        const r = await redisOps();

        const shortcode = needShortCode ? await dynamoDBOps.game.getUniqueShortcode() : null;

        const gameId = generateUUID();
        let players: number = STANDARD_MAX_PLAYERS;
        if (!StandardModes.has(gameinfo.gamemode)) {
            throw new Error('Invalid game mode for now. help!');
        }

        const gameMeta = GameMetadataSchema.parse({
            state: GameState.SCHEDULED,
            players: Array(players).fill(null),
            gamemode: gameinfo.gamemode,
            startTimestamp: Date.now(),
            base_time: gameinfo.time_control?.base_time,
            increment: gameinfo.time_control?.increment,
            disadvantage: gameinfo.time_control?.disadvantage,
            shortcode: shortcode,
        });

        await r.game.setInitialMetadata(gameId,  gameMeta);

        await r.game.setInitialTimedata(gameId, players);

        return { id: gameId, ...gameMeta};
    },

    async StartStandardGame (gameContext: GameContext): Promise<void> {
        // check that the game exists in redis

        console.log("Starting game with ID:", gameContext.gameId);

        const r = await redisOps();
        
        // Use GameContext to get game data efficiently
        const gameMeta = await gameContext.getMetadata();
        const gTimes = await gameContext.getTimedata();
        if (!gameMeta || !gTimes || !(StandardModes.has(gameMeta.gamemode))) {
            throw new Error('Game not valid');
        }  
        // check that the game is in the scheduled state
        if (gameMeta.state !== GameState.SCHEDULED) {
            throw new Error('Game is not in scheduled state');
        }
        
        // shuffle the gamemeta players
        gameMeta.players = gameMeta.players.sort(() => Math.random() - 0.5);

        // update the game metadata state to in progress
        await r.game.updateGameMetadataState(gameContext.gameId!, GameState.IN_PROGRESS);
        // update the game metadata with the players
        await r.game.updateGameMetadata(gameContext.gameId!, { players: gameMeta.players });

        this.ConnectPlayerSocket(gameContext);

    },

    /**
     * Function sends the game setup data to the player's socket. This includes player profiles, time controls, and elo changes if applicable.
     */
    async ConnectPlayerSocket (gameContext: GameContext, meOnly: boolean = false): Promise<void> {

        gameContext.invalidateAll();
        const gameMeta = await gameContext.getMetadata();
        const gTimes = await gameContext.getTimedata();
        if (!gameMeta || !gTimes) {
            throw new Error('Game not found');
        }

        if (!StandardModes.has(gameMeta.gamemode)) {
            throw new Error('Unimplemented gamemode for socket connection');
        }

        // Common setup data for all standard modes
        const baseSetupData = {
            moves: await gameContext.getMoves(),
            shortcode: gameMeta.shortcode || '', // Ensure string type for StandardGameMetadata
            gamemode: gameMeta.gamemode,
            rTimes: [1000 * gameMeta.base_time, 1000 * gameMeta.base_time + 1000 * gameMeta.disadvantage] as [number, number],
            lTime: gTimes.lMove || 0, // Ensure number type
            turn: 0
        };

        const io = getSocketIO();
        const isBotGame = gameMeta.gamemode === GameMode.STANDARD_BOT_MATCH;

        // Get player profiles
        const p1Id = parseUser(gameMeta.players[0]);
        const p2Id = parseUser(gameMeta.players[1]);
        
        let p1Profile: PlayerData, p2Profile: PlayerData;
        
        if (isBotGame) {
            // BOT LOGIC: Determine which player is human and which is bot
            const humanIndex = gameMeta.players.findIndex(p => p !== null && !isBotIdentity(p));
            const botIndex = 1 - humanIndex;
            
            if (humanIndex === -1) {
                throw new Error('No human player found in bot game');
            }

            const humanPlayer = gameMeta.players[humanIndex];
            const botPlayer = gameMeta.players[botIndex];

            if (!humanPlayer || !botPlayer) {
                throw new Error('Invalid player configuration in bot game');
            }

            const humanId = parseUser(humanPlayer);
            const humanUserProfile = await userService.GetUserByID(humanId);
            
            // Convert to PlayerData by adding time field
            const humanProfile: PlayerData = {
                ...humanUserProfile,
                time: 1000 * gameMeta.base_time,
                elo: undefined,
            };
            
            // Bot profile with required PlayerData fields (frontend will lookup full bot info)
            const botProfile: PlayerData = { 
                username: botPlayer, // Bot UUID - frontend will use this to lookup bot info
                time: 1000 * gameMeta.base_time + 1000 * gameMeta.disadvantage,
                elo: undefined, // Frontend will set from bot info
            };

            // Assign to correct positions (index 0 = red, index 1 = yellow)
            p1Profile = humanIndex === 0 ? humanProfile : botProfile;
            p2Profile = humanIndex === 0 ? botProfile : humanProfile;
        } else {
            // Regular player game - get both player profiles and convert to PlayerData
            const p1UserProfile = await userService.GetUserByID(p1Id);
            const p2UserProfile = await userService.GetUserByID(p2Id);
            
            p1Profile = {
                ...p1UserProfile,
                time: 1000 * gameMeta.base_time,
                elo: undefined,
            };
            p2Profile = {
                ...p2UserProfile,
                time: 1000 * gameMeta.base_time + 1000 * gameMeta.disadvantage,
                elo: undefined,
            };
        }

        // Get elo changes for competitive modes (not for bot games)
        let eloChanges: Map<string, EloChange> | null = null;
        if (CompetitiveModes.has(gameMeta.gamemode) && !isBotGame) {
            if (!p1Id || !p2Id) {
                throw new Error('Players not found in game metadata for competitive mode');
            }
            eloChanges = await this.getGameEloChanges(gameContext);
        }

        // Helper function to send setup to a specific player
        const sendSetupToPlayer = (playerIndex: 0 | 1) => {
            const playerId = gameMeta.players[playerIndex];
            if (!playerId) return;

            // Skip if meOnly is true and this isn't the requesting player
            if (meOnly && gameContext.userId !== playerId) return;

            const playerUserId = parseUser(playerId);
            const playerEloChange = eloChanges?.get(playerUserId!) || null;

            const setupPayload: StandardGameMetadata = {
                ...baseSetupData,
                players: [p1Profile, p2Profile],
                myPNum: playerIndex,
                eloChanges: playerEloChange,
            };

            console.log(isBotGame 
                ? `BOT LOGIC: Sending setup to player ${playerIndex + 1} (bot UUID: ${p2Profile.username})`
                : `Sending setup to player ${playerIndex + 1}: ${playerUserId}`
            );

            io.to(RoomSchema.user.key(playerId)).emit(RoomSchema.game.key("setup"), setupPayload);
        };

        // Send setup to both players (or just one if meOnly is true)
        sendSetupToPlayer(0);
        if (!isBotGame) {
            sendSetupToPlayer(1); // Don't send to bot in bot games
        }
    },

    /**
     * Store a game from redis into the NOSQL database.
     */
    async StoreGame (gameContext: GameContext): Promise<void> {

        const gameId = await gameContext.resolveGameId();
        if (!gameId) {
            throw new Error('Game ID is null');
        }

        // Get all game data using GameContext for consistency
        const { metadata, timedata, moves } = await gameContext.getAllGameData();
        if (!metadata || !timedata) {
            throw new Error('Game not found in redis');
        }

        if (!FinishedGameStates.has(metadata.state)) {
            throw new Error('Game is not finished');
        }

        const gameinfo = gameinfoFromMeta(metadata);

        if (StandardModes.has(metadata.gamemode)) {
          
            // TODO: DDB setting here
            const ddb = dynamoDBOps.game;

            // Ensure players is a string[]
            if (metadata.players.some(p => p === null)) {
                throw new Error('Invalid player in game metadata');
            }
            await ddb.storeGame(
                uuidToBuffer(gameId),
                metadata.players as string[],
                packStandardGameData(moves, timedata.mTimes),
                packGameInfo(gameinfo),
                metadata.state,
                metadata.shortcode ?? undefined
            );            
            // For each player in the game, store in the playerdata table
            // get elos from game queue
            const eloChanges = await this.getGameEloChanges(gameContext);
    
            // filter the players from the game metadata by isUserIdentity
            const requiredPlayers = metadata.players.filter(playerId => isUserIdentity(playerId!));

            for (const player of requiredPlayers) {
                // recalculate the elo change with the result of the game (it is a pure function)
                const eloChange = eloChanges.get(player!);
                const playerData = {}

            }

        } else {
            throw new Error('Game is not in a valid state for storing');
        }
        

    },


    /**
     * Assigns a player to a game by updating the game metadata and user queue.
     */
    async AssignPlayerToGame (gameContext: GameContext, elo: number | null, playerColor?: PlayAs): Promise<void> {

        // check that the player is not already in a game and exists in the redis players list
        const r = await redisOps();
        if (!gameContext.gameId) {
            throw new Error('Game ID is null');
        }

        // game exists and should exist in user queue on redis
        let gameMetadata = await gameContext.getMetadata();
        if (!gameMetadata) {
            throw new Error('Game metadata not found');
        }
        if (gameMetadata.state !== GameState.SCHEDULED) {
            throw new Error('Game is not scheduled');
        }

        const queueEntry: Partial<UserQueue> = {
            gameId: gameContext.gameId,
        };
        if (elo !== null && elo !== undefined) {
            queueEntry.elo = elo;
        }
        await r.game.addOrUpdateUserGameQueue(gameContext.userId, queueEntry as UserQueue);
        
        if (StandardModes.has(gameMetadata.gamemode)) {
            // go through the player list and insert user id in the first null slot available or fail
            let listToPass = gameMetadata.players;
            if (listToPass.length == 0) {
                listToPass = [null, null];
            }
            const playerList = addToPlayerList(listToPass, gameContext.userId, playerColor ?? PlayAs.FIT_IN);
            await r.game.updateGameMetadata(gameContext.gameId, { players: playerList });
            gameContext.invalidateMetadata();
        }
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

    /* This gets called when user joins game by link or reconnect (not "find game" button press) */
    async requestGameData(gameContext: GameContext): Promise<ServiceResponse> {
        try {
            // Get fresh metadata - don't rely on cached data for critical decisions
            gameContext.invalidateAll();
            const metadata = await gameContext.getMetadata();
            
            if (!metadata || !gameContext.resolveGameId()) {

                // CHECK GAME IN REDIS
                // ELSE CALL NO SQL HERE
                console.log("Redis or NOSQL would be called....");
                return { status: 404, message: ErrorCode.GAME_NOT_FOUND };
            }
            
            // Check if user is already in this game with fresh data
            const isAlreadyPlayer = await gameContext.isPlayerInGame();
            if (isAlreadyPlayer) {

                if (metadata.state === GameState.IN_PROGRESS || metadata.state === GameState.SCHEDULED) {
                    console.log("RECONNECTING SPECIFIC PLAYER");
                    let connect = false;
                    if (metadata.state === GameState.IN_PROGRESS) {
                        connect = true;
                    } 
                    else { // scheduled games!!!! (2 moves not made yet)
                        // if all players are present and scheduled then connect sockets
                        if (metadata.gamemode === GameMode.STANDARD_BOT_MATCH) {
                            connect = true;
                        } else if (StandardModes.has(metadata.gamemode)) {
                            if (metadata.players.every(p => p !== null)) {
                                connect = true;
                            }
                        }
                    }
                    if (connect) await this.ConnectPlayerSocket(gameContext, true);
                     
                    return { status: 200, message: 'Already in the game' };
                } else {
                    console.log("Game is in an unexpected state:", metadata.state);
                    return { status: 410, message: ErrorCode.GAME_FINISHED };
                }
            }
            
            // Link based joining - check if the game is joinable
            // Check if user can join (using fresh metadata)
            const canJoin = await this.checkPlayerCanJoinGame(gameContext);
            if (canJoin) {
                // assume no elo for now...
                await this.AssignPlayerToGame(gameContext, null); // this could be a future issue
                
                if (StandardModes.has(metadata.gamemode)) { // link join 
                    // Refresh metadata after adding player
                    gameContext.invalidateMetadata();
                    const updatedMetadata = await gameContext.getMetadata();
                    if (updatedMetadata && updatedMetadata.state === GameState.SCHEDULED && 
                        updatedMetadata.players.every(p => p !== null) &&
                        updatedMetadata.players.length === STANDARD_MAX_PLAYERS) {
                        // If the game is scheduled and now has 2 players, start the game
                        await this.StartStandardGame(gameContext);
                        return { status: 100, message: gameContext.gameId ?? "" };
                    }
                }
            } else {
                await this.SpectateGame(gameContext);
                return { status: 101, message: 'Spectating Game' };
            }
            return { status: 200, message: 'Game joined successfully' };
        } catch (error) {
            console.error('Error joining game:', error);
            return { status: 500, message: 'Failed to join game' };
        }
    },

    async checkPlayerCanJoinGame(gameContext: GameContext): Promise<boolean> {
        // Use fresh metadata if not provided
        const gameMeta = await gameContext.getMetadata();
        if (!gameMeta) return false;

        // Get fresh player data
        gameContext.invalidatePlayerData();
        const isPlayer = await gameContext.isPlayerInGame();
        if (isPlayer) {
            return false; // Player is already in the game
        }

        // Casual mode checks for link based joining
        if (CasualModes.has(gameMeta.gamemode)) {
            if (gameMeta.state === GameState.IN_PROGRESS) {
                return false; // spectating is allowed in casual games
            } else if (gameMeta.players.length < STANDARD_MAX_PLAYERS || 
                       gameMeta.players.some(p => p === null)
            ) {
                return true;  // Player can join the game
            } else {
                return false; // Game is full but scheduling or something
            }
        }
        return false;
    },

    async checkPlayerInGame(gameContext: GameContext): Promise<void> {
        // check that the player is not already in a game and exists in the redis players list
        const myId = await gameContext.resolveGameId();
        if (myId && myId === gameContext.gameId) {
            return; // Player is in the game
        } 
        throw new Error('Player is not in the game');
    },

    async SpectateGame(gameContext: GameContext): Promise<void> {
        // Get fresh metadata for spectating decisions
        const gameMeta = await gameContext.getMetadata();

        // send spectating data


        
    },
   
    async getGameEloChanges (gameContext: GameContext): Promise<Map<string, EloChange>> {
        // Get elo changes for all players in the game
        const eloChanges: Map<string, EloChange> = new Map();

        gameContext.invalidateMetadata();
        const gameMeta = await gameContext.getMetadata();
        if (!gameMeta) {
            throw new Error('Game metadata not found');
        }

        if (!StandardModes.has(gameMeta.gamemode)) {
            throw new Error ('Unimplemented gamemode for elo changes');
        } else {

            if (CasualModes.has(gameMeta.gamemode)) {
                // Casual games do not have elo changes
                return eloChanges;
            }

            const p1Id  = parseUser(gameMeta.players[0]);
            const p2Id  = parseUser(gameMeta.players[1]);
            if (!p1Id || !p2Id) {
                throw new Error('A player not found in game metadata or anonymous player');
            }
            const p1Elo = await userService.getOrSetPlayerElo(p1Id, gameMeta.gamemode);
            const p2Elo = await userService.getOrSetPlayerElo(p2Id, gameMeta.gamemode);
            const p1EloChange = calculateEloChanges(p1Elo, p2Elo, true);
            const p2EloChange = calculateEloChanges(p2Elo, p1Elo, false);

            eloChanges.set(gameMeta.players[0]!, p1EloChange);
            eloChanges.set(gameMeta.players[1]!, p2EloChange);
        }


        return eloChanges;
    },


    

}