import { dynamoDBOps } from "@/db/dynamodb/ops";
import { redisOps } from "@/redis/ops";
import { ServiceResponse } from "@/types/custom";
import { EloChange, GameInfo, GameSetupParams, TimeControl } from "@shared/types/game.types";
import { CasualModes, CompetitiveModes, StandardModes } from "@shared/utils/gamemodes";
import { packGameInfo, packStandardGameData, uuidToBuffer } from "@/utils/binary";
import { GameState } from "@shared/constants/allgamestates";
import { FinishedGameStates } from "@shared/utils/gamestates";
import { calculateEloChanges, gameinfoFromMeta } from "@/utils/game";
import { generateUUID } from "@/utils/auth";
import { GameMetadata, GameMetadataSchema, UserQueue } from "@/redis/redisSchema";
import { isUserIdentity, makeUserIdentity, parseUser, makeBotIdentity } from "@/utils/validation";
import { getSocketIO } from "@/controllers/socket";
import { userService } from "./user.service";
import { AllGameModes, GameMode, t_GameMode } from "@shared/constants/allgamemodes";
import { ErrorCode, createErrorResponse } from "@shared/constants/errorCodes";
import { RoomSchema } from "@/controllers/socket/socketRoomSchema";
import { GameContext } from "@/utils/gameContext";
import { PlayAs } from "@shared/types/game.types";
import { UUID } from "crypto";
import { liveGameService } from "./livegame.service";

export const gameService = {

    async checkUserInGame (gameContext: GameContext): Promise<ServiceResponse> {
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

                if (metadata.state === GameState.IN_PROGRESS) {
                    return { status: 409, message: ErrorCode.ALREADY_IN_GAME, redirect: metadata.shortcode || gameId };
                } else if (metadata.state === GameState.SCHEDULED) {
                    return { status: 409, message: ErrorCode.ALREADY_IN_QUEUE, redirect: metadata.shortcode || gameId };
                }
            } catch (error) {
                console.error('Error getting game metadata:', error);
                return { status: 500, message: 'Game Error - unable to get game metadata' };
            }

            await r.game.leaveUserQueue(gameContext.userId);
        }
        return { status: 200, message: 'User not in a game' };
    },
  
    /**
     * Function called to being matchmaking for a user. If a match is found, it will return the game ID. If not, user will be added to redis queue.
     */
    async joinGameQueue (gameContext: GameContext, gameparams: GameSetupParams): Promise<ServiceResponse> {

        const { gamemode } = gameparams;

        // invariant, the user is NOT in a game or queue already - checked in middleware

        if (CompetitiveModes.has(gamemode)) {

            return { status: 404, message: 'Not Implemented Yet' };
            // const competitiveResult = await this.joinCompetitiveQueue(gameContext, gameInfo);
            // if (competitiveResult) {
            //     return competitiveResult;
            // }

        } else if (CasualModes.has(gamemode)) {
            return await this.joinCasualQueue(gameContext, gameparams);
        } else if (gamemode === GameMode.STANDARD_BOT_MATCH) {
            return await this.joinBotQueue(gameContext, gameparams);
        } else {
            return { status: 400, message: 'Invalid Game Mode' };
        }
    },

    /**
     * Function called to create a casual/friendly/fun game and return the shortcode immediately.
     */
    async joinCasualQueue (gameContext: GameContext, gameparams: GameSetupParams): Promise<ServiceResponse> {

        const { gamemode, time_control } = gameparams;
        const gameInfo = { gamemode, time_control };

        if (!CasualModes.has(gamemode)) {
            return { status: 400, message: 'Invalid Game Mode' };
        }

        const r = await redisOps();

        await r.game.addOrUpdateUserGameQueue(gameContext.userId, {
            gameinfo: packGameInfo(gameInfo),
            timeAdded: Date.now(),            
        } as UserQueue);
        console.log(`User ${gameContext.userId} added to casual queue for game mode ${gamemode}`);

        // For friendly or casual games, we can directly create a game and return the shortcode
        const gameMeta = await this.CreateGame(gameInfo, true);
        
        // Create a new GameContext for the new game
        const newGameContext = await GameContext.fromGameId(gameContext.userId, gameMeta.id);
        await this.AssignPlayerToGame(newGameContext, null); // called without elo for casual games
        return { status: 200, message: gameMeta.shortcode || gameMeta.id };

    },

    /**
     * Function called to create a bot game with the given parameters. The bot game will have no timers and the bot will play instantly.
     */
    async joinCompetitiveQueue (gameContext: GameContext, gameparams: GameSetupParams): Promise<ServiceResponse | null> {
        // if the user is already in a game or already in a queue, throw an error
        throw new Error('Not implemented yet');
        const r = await redisOps();
        const { gamemode, time_control } = gameparams;
        const gameInfo = {
            gamemode, time_control
        }

        // get user elo for the gamemode
        const userElo = await userService.getOrSetPlayerElo(gameContext.userId, gamemode);
        
        // Add user to the competitive queue
        await r.game.addOrUpdateUserGameQueue(gameContext.userId, {
            gameinfo: packGameInfo(gameInfo),
            timeAdded: Date.now(),
            elo: userElo,
        } as UserQueue);
        
        console.log(`User ${gameContext.userId} added to competitive queue for game mode ${gamemode} with ELO ${userElo}`);
        
        // TODO: Implement actual matchmaking logic
        // check redis game players with this gamemode and sort by elo AND time added
        // if there is a good match, call create game to set up the game and return the string gameID
        // if there is no match, user stays in queue
        
        // For now, just return null to indicate user was added to queue
        return null;
    },

    /**
     * Function called to create a bot game with the given parameters. The bot game will have no timers and the bot will play instantly.
     */
    async joinBotQueue(gameContext: GameContext, gameparams: GameSetupParams): Promise<ServiceResponse> {
        const { gamemode, botId, playerColor } = gameparams;

        const r = await redisOps();
        
        try {

            // BOT LOGIC: Force time control to zero for bot games - no timers allowed
            const botTimeControl: TimeControl = {
                base_time: 180,
                increment: 2,
                disadvantage: 10
            };

            // Create the game with zero time control
            const gameMeta = await this.CreateGame({ gamemode, time_control: botTimeControl }, false);
            const gameId = gameMeta.id;

            // Create bot identity
            const botIdentity = makeBotIdentity(botId as UUID);

            
            // Assign human player to the game
            const newGameContext = await GameContext.fromGameId(gameContext.userId, gameId);
            await this.AssignPlayerToGame(newGameContext, playerColor);
            
            console.log(`[BOT GAME] Created bot game ${gameId}: Human (${gameContext.userId}) vs Bot (${botId} timers disabled`);
            
            return { status: 200, message: gameMeta.shortcode || gameId };
            
        } catch (error) {
            console.error('Error creating bot game:', error);
            return { status: 500, message: 'Failed to create bot game' };
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
        const gameMeta = GameMetadataSchema.parse({
            state: GameState.SCHEDULED,
            players: [],
            gamemode: gameinfo.gamemode,
            startTimestamp: Date.now(),
            base_time: gameinfo.time_control?.base_time,
            increment: gameinfo.time_control?.increment,
            disadvantage: gameinfo.time_control?.disadvantage,
            shortcode: shortcode,
        });

        await r.game.setInitialMetadata(gameId,  gameMeta);

        await r.game.setInitialTimedata(gameId);

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

    async ConnectPlayerSocket (gameContext: GameContext, meOnly: boolean = false): Promise<void> {

        gameContext.invalidateAll();
        const gameMeta = await gameContext.getMetadata();
        const gTimes = await gameContext.getTimedata();
        if (!gameMeta || !gTimes) {
            throw new Error('Game not found');
        }

        // BOT LOGIC: Prevent reconnection to bot games - they should have already ended on disconnect
        if (gameMeta.gamemode === GameMode.STANDARD_BOT_MATCH) {
            throw new Error('Reconnection not allowed in bot games');
        } else if (StandardModes.has(gameMeta.gamemode)) {

        

            const p1Id = parseUser(gameMeta.players[0]);
            const p2Id = parseUser(gameMeta.players[1]);
            const p1 = await userService.GetUserByID(p1Id);
            const p2 = await userService.GetUserByID(p2Id);

            const SettingUpData = {
                moves: await gameContext.getMoves(),
                shortcode: gameMeta.shortcode,
                gamemode: gameMeta.gamemode,
                rTimes: [1000 * gameMeta.base_time, 1000 * gameMeta.base_time + 1000 * gameMeta.disadvantage],
                lTime: gTimes.lMove,
                turn: 0
            }

            let p1EloChange, p2EloChange;
            if (CompetitiveModes.has(gameMeta.gamemode)) {
                
                if (!p1Id || !p2Id) {
                    throw new Error('Players not found in game metadata');
                }

                const allEloChanges = await this.getGameEloChanges(gameContext);
                p1EloChange = allEloChanges.get(p1Id);
                p2EloChange = allEloChanges.get(p2Id);

            }

            // each player needs to be send the game setup metadata
            const io = getSocketIO();
            if (!meOnly || gameContext.userId === gameMeta.players[0]) {
                console.log("Sending setup to player 1:", p1);
                io.to(RoomSchema.user.key(gameMeta.players[0] ?? "")).emit(RoomSchema.game.key("setup"), {
                    ...SettingUpData,
                    me: p1,
                    opponent: p2,
                    iRed: true,
                    eloChanges: p1EloChange,
                });
            } 
            if (!meOnly || gameContext.userId === gameMeta.players[1]) {
                console.log("Sending setup to player 2:", p2);
                io.to(RoomSchema.user.key(gameMeta.players[1] ?? "")).emit(RoomSchema.game.key("setup"), {
                    ...SettingUpData,
                    me: p2,
                    opponent: p1,
                    iRed: false,
                    eloChanges: p2EloChange,
                });
            }
        } else {
            // Handle non-standard modes
            throw new Error('Unimplemented gamemode for socket connection');
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
        
        await r.game.assignUserToGameQueue(gameContext.userId, gameContext.gameId, elo);

        if (StandardModes.has(gameMetadata.gamemode)) {
            // go through the player list and insert user id in the first null slot available or fail
            const playerList = gameMetadata.players;
            if (playerColor !== undefined) {
                let idx = -1;
                if (playerColor === PlayAs.RED) {
                    idx = 0;
                } else if (playerColor === PlayAs.YELLOW) {
                    idx = 1;
                } else if (playerColor === PlayAs.RANDOM) {
                    idx = Math.random() < 0.5 ? 0 : 1;
                } else {
                    throw new Error('Invalid player color');
                }

                if (playerList[idx] !== null) {
                    throw new Error('Requested color already taken');
                } 
                playerList[idx] = gameContext.userId;
            } else {
                const emptySlotIndex = playerList.findIndex(playerId => playerId === null);
                if (emptySlotIndex === -1) {
                    throw new Error('No available slot in player list');
                }
                playerList[emptySlotIndex] = gameContext.userId;
            }
            await r.game.updateGameMetadata(gameContext.gameId, { players: playerList });
            gameContext.invalidateMetadata();
        } else {
            throw new Error('Unimplemented gamemode for assigning player');
        }

    },

    async requestGameData(gameContext: GameContext): Promise<ServiceResponse> {
        try {
            // Get fresh metadata - don't rely on cached data for critical decisions
            gameContext.invalidateMetadata();
            const metadata = await gameContext.getMetadata();
            
            if (!metadata || !gameContext.resolveGameId()) {

                // CALL NO SQL HERE

                return { status: 404, message: ErrorCode.GAME_NOT_FOUND };
            }
            console.log("Trying to join game with ID:", gameContext.gameId, "and metadata:", metadata);
            
            // BOT LOGIC: Prevent joining bot games if they exist - bot games should end immediately on disconnect
            if (metadata.gamemode === GameMode.STANDARD_BOT_MATCH) {
                return { status: 404, message: ErrorCode.BOT_GAME_ENDED };
            }
            
            // Check if user is already in this game with fresh data
            gameContext.invalidatePlayerData();
            const isAlreadyPlayer = await gameContext.isPlayerInGame();
            if (isAlreadyPlayer) {

                if (metadata.state === GameState.IN_PROGRESS) {
                    console.log("RECONNECTING SPECIFIC PLAYER");
                    await this.ConnectPlayerSocket(gameContext, true);
                    return { status: 200, message: 'Reconnected to game' };
                } else if (metadata.state === GameState.SCHEDULED) {
                    console.log("Already waiting for game to start");
                    return { status: 200, message: 'Already in the game' };
                } else {
                    console.log("Game is in an unexpected state:", metadata.state);
                    // TODO LOAD GAME from REDIS
                    return { status: 410, message: ErrorCode.GAME_FINISHED };
                }
            }
            
            // Link based joining - check if the game is joinable
            // Check if user can join (using fresh metadata)
            const canJoin = await this.checkPlayerCanJoinGame(gameContext);
            if (canJoin) {
                // assume no elo for now...
                await this.AssignPlayerToGame(gameContext, null); // this could be a future issue
                
                if (CasualModes.has(metadata.gamemode)) {
                    // Refresh metadata after adding player
                    gameContext.invalidateMetadata();
                    const updatedMetadata = await gameContext.getMetadata();
                    if (updatedMetadata && updatedMetadata.state === GameState.SCHEDULED && 
                        updatedMetadata.players.length === 2) {
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

        if (CasualModes.has(gameMeta.gamemode)) {
            if (gameMeta.state === GameState.IN_PROGRESS) {
                return false; // spectating is allowed in casual games
            } else if (gameMeta.players.length < 2) {
                return true; // Player can join the game
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