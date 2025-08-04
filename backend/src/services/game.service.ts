import { dynamoDBOps } from "@/db/dynamodb/ops";
import { redisOps } from "@/redis/ops";
import { ServiceResponse } from "@/types/custom";
import { GameInfo, TimeControl } from "@shared/types/game";
import { CasualModes, CompetitiveModes, FriendlyModes, PublicStandardModes, StandardModes } from "@shared/utils/gamemodes";
import { packGameInfo, packGameInfoToString } from "@/utils/binary";
import { GameState } from "@shared/constants/allgamestates";
import { calculateEloChanges, genGameShortcode } from "@/utils/game";
import { generateUUID } from "@/lib/auth/auth";
import { GameMetadata, GameMetadataSchema, UserQueue } from "@/redis/redisSchema";
import { isUserIdentity, makeUserIdentity, parseUser } from "@/utils/validation";
import { UUID } from "crypto";
import { getSocketIO } from "@/controllers/socket";
import { userService } from "./user.service";
import { AllGameModes } from "@shared/constants/allgamemodes";
import { RoomSchema } from "@/controllers/socket/socketRoomSchema";
import { GameContext } from "@/utils/gameContext";

export const gameService = {
  
    /**
     * Function called to being matchmaking for a user. If a match is found, it will return the game ID. If not, user will be added to redis queue.
     */
    async joinGameQueue (gameContext: GameContext, gameInfo: GameInfo): Promise<ServiceResponse> {

        const { gamemode } = gameInfo;

        const r = await redisOps();

        // check if user is already in a game or in a queue
        const gameId = await this.getGameIDOfPlayer(gameContext.userId);
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
                    return { status: 403, message: metadata.shortcode || gameId };
                } else if (metadata.state === GameState.SCHEDULED) {
                    return { status: 403, message: metadata.shortcode || gameId };
                }
            } catch (error) {
                console.error('Error getting game metadata:', error);
                return { status: 500, message: 'Game Error - unable to get game metadata' };
            }

            return { status: 400, message: 'Already in a game' };
        }

        if (CompetitiveModes.has(gamemode)) {

            await this.joinCompetitiveQueue(gameContext.userId, gameInfo);

        } else if (CasualModes.has(gamemode)) {

            return await this.joinCasualQueue(gameContext.userId, gameInfo);

        } else {
            return { status: 400, message: 'Invalid Game Mode' };
        }

        return { status: 500, message: 'TODO' };
    },


    async joinCasualQueue (userId: string, gameInfo: GameInfo): Promise<ServiceResponse> {
        
        const { gamemode } = gameInfo;

        if (!CasualModes.has(gamemode)) {
            return { status: 400, message: 'Invalid Game Mode' };
        }

        const r = await redisOps();

        await r.game.addOrUpdateUserGameQueue(userId, {
            gameinfo: packGameInfoToString(gameInfo),
            timeAdded: Date.now(),            
        } as UserQueue);
        console.log(`User ${userId} added to casual queue for game mode ${gamemode}`);

        // For friendly or casual games, we can directly create a game and return the shortcode

        const gameMeta = await this.CreateGame(gameInfo);
        
        await this.AssignPlayerToGame(gameMeta.id, userId, null, gameMeta);
        return { status: 200, message: gameMeta.shortcode || gameMeta.id };

    },


    async joinCompetitiveQueue (userId: string,  gameInfo: GameInfo): Promise<ServiceResponse | null> {
        // if the user is already in a game or already in a queue, throw an error

        // get user elo for the gamemode
        // check redis game players with this gamemode and sort by elo AND time added
        
        // if there is a good match, call create game to set up the game and return the string gameID

        // if there is no match, add user to redis queue for this gamemode and time control
        // return null if no match is found so the user is shown a "Searching for match" message

        // IF
        // REDIS
        // IS
        // Less
        // THAN 50
        // PAIR WITH BOT

        // Check if the user is already in the game lookup

        
        // const userElo = await userService.getOrSetPlayerElo(userId, gamemode);
    
        let priority = 0;
        // get the time since the user was added to the game lookup maybe??

        // if (priority > 0) {
        //     const gameId = await dbOperations.GetGameByPlayerLookup(userId);
        //     if (!gameId) {
        //         await dbOperations.FinishedGameLookup(userId); // remove from game lookup if they are not in a game
        //     } else {

        //         try {
        //             const game = await dbOperations.GetGameByID(gameId!);
        
        //             if (game.state === globals.StandardGameStates.ongoing) {
        //                 res.status(200).json({ event: 'sendToRoom', 
        //                     data: { roomId: game.short_id }
        //             } as SendToRoom);
        //                 return;
        //             }
        //             else if (game.state === globals.StandardGameStates.scheduled) {
        //                 //Update the game lookup here
        //                 await dbOperations.FinishedGameLookup(userId);
        //                 //Delete the game player entry here
        //                 await dbOperations.UnassignGame(game.id, userId);
        //             }
        //             else {
        //                 await dbOperations.FinishedGameLookup(userId);
        //             }
        //         }
        //         catch (error) {
        //             console.log('Failed to remove user from game search:', error);
        //             return;
        //         }
        //     }
        // }
            
            return null; // Placeholder for actual matchmaking logic
    },

    /**
     * Function called to quit the matchmaking queue for a user.
     */
    async QuitGameSearch (gameContext: GameContext): Promise<void> {
        
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(gameContext.userId);
        if (gameId) {
            try {
                const existingGameContext = await GameContext.fromGameId(gameContext.userId, gameId);
                const metadata = await existingGameContext.getMetadata();
                
                if (metadata) {
                    if (metadata.state === GameState.SCHEDULED) {
                        await r.game.leaveUserQueue(gameContext.userId);
                        return;
                    } else if (metadata.state === GameState.IN_PROGRESS) {
                        throw new Error('User is already in a game');
                    }
                } else {
                    await r.game.leaveUserQueue(gameContext.userId);
                    return;
                }
            } catch (error) {
                await r.game.leaveUserQueue(gameContext.userId);
                return;
            }
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
    async CreateGame (gameinfo: GameInfo): Promise<GameMetadata & { id: string }> {

        // create a new game with the given gamemode and time control

        const r = await redisOps();

        const shortcode = genGameShortcode();
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

    async StartStandardGame (gameId: string): Promise<void> {
        // check that the game exists in redis

        console.log("Starting game with ID:", gameId);

        const r = await redisOps();
        
        // Use GameContext for the first player to get game data efficiently
        // Since we don't know userId yet, we'll get metadata directly first
        const gameMeta = await r.game.getGameMetadata(gameId);
        const gTimes = await r.game.getGameTimes(gameId);
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
        await r.game.updateGameMetadataState(gameId, GameState.IN_PROGRESS);
        // update the game metadata with the players
        await r.game.updateGameMetadata(gameId, { players: gameMeta.players });

        const p1Id = parseUser(gameMeta.players[0]);
        const p2Id = parseUser(gameMeta.players[1]);

        let p1 = await userService.safeGetUserByID(p1Id);
        let p2 = await userService.safeGetUserByID(p2Id);

        const SettingUpData = {
            moves: [],
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

            // GET THE ELO CHANGES HERE
            const p1Elo = await userService.getOrSetPlayerElo(p1Id, gameMeta.gamemode);
            const p2Elo = await userService.getOrSetPlayerElo(p2Id, gameMeta.gamemode);
            p1EloChange = calculateEloChanges(p1Elo, p2Elo, true);
            p2EloChange = calculateEloChanges(p2Elo, p1Elo, false);
        }

        // each player needs to be send the game setup metadata
        const io = getSocketIO();
        io.to(RoomSchema.user.key(gameMeta.players[0])).emit(RoomSchema.game.key("setup"), {
            ...SettingUpData,
            me: p1,
            opponent: p2,
            iRed: true,
            eloChanges: p1EloChange,
        });

        io.to(RoomSchema.user.key(gameMeta.players[1])).emit(RoomSchema.game.key("setup"), {
            ...SettingUpData,
            me: p2,
            opponent: p1,
            iRed: false,
            eloChanges: p2EloChange,
        });

    },


    /**
     * Store a game from redis into the NOSQL database.
     * @param gameId 
     * @param gameData 
     */
    async StoreGame (gameId: string): Promise<void> {

        // check that the game exists in redis
        // Store the game data in the NOSQL database game table

        const r = await redisOps();

        // Get all game data - we can use direct Redis calls here since we need all the data anyway
        // and this is a background operation where we're not concerned about multiple user contexts
        const gameMeta = await r.game.getGameMetadata(gameId);
        if (!gameMeta) {
            throw new Error('Game not found in redis');
        }
        const gameTimes = await r.game.getGameTimes(gameId);
        const gameMoves = await r.game.getGameMoves(gameId);

        // process data here 

        // Store the game shortcode map in the NOSQL database game shortcode table if there is one
        // await dynamoDBOps.game.StoreGame(gameId, gameMeta, gameTimes, gameMoves);

        // For each player in the game, store in the playerdata table

        // filter the players from the game metadata by isUserIdentity
        const requiredPlayers = gameMeta.players.filter(playerId => isUserIdentity(playerId));
        
        // get elos from game queue

        // recalculate the elo change with the result of the game (it is a pure function)

        // remove the game from redis
        await r.game.dropGame(gameId);
    },

    async AssignPlayerToGame (gameId: string, userId: string, elo?: number | null, gameMeta?: GameMetadata): Promise<void> {

        // check that the player is not already in a game and exists in the redis players list
        const r = await redisOps();
        const myId = await this.getGameIDOfPlayer(userId);
        console.log("MYID -------------------" + myId + userId + " GAMEID: " + gameId);
        if (myId && myId !== gameId) {
            throw new Error('Player is already in a different game');
        }

        try {
            await r.game.assignUserToGameQueue(userId, gameId, elo);
        } catch (error) {


            let gameMetadata = gameMeta;
            if (!gameMetadata) {
                const meta = await r.game.getGameMetadata(gameId);
                if (!meta) {
                    throw new Error('Game metadata not found');
                }
                gameMetadata = meta;
            }


            await r.game.addOrUpdateUserGameQueue(userId, {
                gameinfo: packGameInfoToString({
                    gamemode: gameMetadata.gamemode,
                    time_control: {
                        base_time: gameMetadata.base_time,
                        increment: gameMetadata.increment,
                        disadvantage: gameMetadata.disadvantage,
                    },
                } as GameInfo),
                timeAdded: Date.now(),
                elo,
                gameId
                } as UserQueue);
        }
        await r.game.addUserToGameMetadata(gameId, userId);
        
        
    },

    async tryJoinGame(gameContext: GameContext): Promise<ServiceResponse> {
        try {
            // Get fresh metadata - don't rely on cached data for critical decisions
            gameContext.invalidateMetadata();
            const metadata = await gameContext.getMetadata();
            
            if (!metadata || !gameContext.gameId) {
                return { status: 404, message: 'Game not found' };
            }
            
            // Check if user is already in this game with fresh data
            gameContext.invalidatePlayerData();
            const isAlreadyPlayer = await gameContext.isPlayerInGame();
            if (isAlreadyPlayer) {
                return { status: 200, message: 'Already in the game' };
            }
            
            // Check if user can join (using fresh metadata)
            const canJoin = await this.checkPlayerCanJoinGame(gameContext);
            console.log(gameContext.gameId, metadata, canJoin);
            if (canJoin) {
                // assume no elo for now...
                await this.AssignPlayerToGame(gameContext.gameId, gameContext.userId, null, metadata);
                
                if (CasualModes.has(metadata.gamemode)) {
                    if (metadata.state === GameState.SCHEDULED && 
                        metadata.players.length + 1 === 2) {
                        // If the game is scheduled and now has 2 players, start the game
                        return { status: 100, message: gameContext.gameId };
                    }
                }
            } else {
                // spectating logic here
                // look for the game
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

    async checkPlayerInRoom(gameContext: GameContext): Promise<void> {
        // Always validate with fresh data for security
        gameContext.invalidatePlayerData();
        await gameContext.validatePlayerInRoom();
    },

    async checkPlayerInGame( userId: string, gameId: string): Promise<void> {
        // check that the player is not already in a game and exists in the redis players list
        const myId = await this.getGameIDOfPlayer(userId);
        if (myId && myId === gameId) {
            return; // Player is in the game
        } 
        throw new Error('Player is not in the game');
    },

    async SpectateGameWithContext(gameContext: GameContext): Promise<void> {
        // Get fresh metadata for spectating decisions
        gameContext.invalidateMetadata();
        const metadata = await gameContext.getMetadata();
        if (!metadata) {
            throw new Error('Game not found');
        }
        
        // Check if user is already a player (cannot spectate own game) with fresh data
        gameContext.invalidatePlayerData();
        const isPlayer = await gameContext.isPlayerInGame();
        if (isPlayer) {
            throw new Error('Cannot spectate own game');
        }
        
        // TODO: Implement spectating logic
    },

    async SpectateGame (gameContext: GameContext): Promise<void> {
        await this.SpectateGameWithContext(gameContext);
    },




    async GetGameIDByShortCode (shortCode: string): Promise<string | null> {
        // check the game exists in redis

        const r = await redisOps();
        const gameId = await r.game.findGameByShortcode(shortCode);

        if (gameId) {
            return gameId;
        }

        // if not, check the game exists in the NOSQL database
        const possibleId = await dynamoDBOps.game.GetGameByShortCode(shortCode)

        if (possibleId) {
            return possibleId;
        }

        // if not, the game does not exist
        
        return null; // Placeholder for actual logic to get game ID by short code
    },


    async getGameIDOfPlayer (userId: string): Promise<string | null> {
        const r = await redisOps();
        return await r.game.getUserQueueGameId(userId);
    },

    async getGameShortCodeOfPlayer (gameContext: GameContext): Promise<string | null> {
        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(gameContext.userId);
        if (!gameId) return null;

        try {
            const existingGameContext = await GameContext.fromGameId(gameContext.userId, gameId);
            const metadata = await existingGameContext.getMetadata();
            return metadata?.shortcode || null;
        } catch (error) {
            const gameMeta = await r.game.getGameMetadata(gameId);
            return gameMeta?.shortcode || null;
        }
    },

    





}