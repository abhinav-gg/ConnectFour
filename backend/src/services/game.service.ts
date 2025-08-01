import { dynamoDBOps } from "@/db/dynamodb/ops";
import { redisOps } from "@/redis/ops";
import { ServiceResponse } from "@/types/custom";
import { GameInfo, TimeControl } from "@shared/types/game";
import { CasualModes, CompetitiveModes, FriendlyModes, PublicStandardModes } from "@shared/utils/gamemodes";
import { packGameInfo, packGameInfoToString } from "@/utils/binary";
import { GameState } from "@shared/constants/allgamestates";
import { genGameShortcode } from "@/utils/game";
import { generateUUID } from "@/lib/auth/auth";
import { GameMetadata } from "@/redis/redisSchema";
import { isUserIdentity, makeUserIdentity } from "@/utils/validation";
import { UUID } from "crypto";
import { getSocketIO } from "@/controllers/socket";

export const gameService = {
  

    /**
     * Function called to being matchmaking for a user. If a match is found, it will return the game ID. If not, user will be added to redis queue.
     * @param userId 
     * @param time_control 
     * @param gamemode 
     * @returns 
     */
    async joinGameQueue (userId: string, gameInfo: GameInfo): Promise<ServiceResponse> {

        const { gamemode } = gameInfo;

        const r = await redisOps();

        // check if user is already in a game or in a queue
        const gameId = await this.getGameIDOfPlayer(userId);
        console.log("User is in game with ID:", gameId);
        if (gameId) {
            
            const game = await r.game.getGameMetadata(gameId);

            if (!game) {
                return { status: 500, message: 'Game Error' };
            }

            if (game.state === GameState.IN_PROGRESS) {
                return { status: 403, message: game.shortcode || gameId };
            } else if (game.state === GameState.SCHEDULED) {
                // they are in a scheduled game, so return the shortcode??
                return { status: 403, message: game.shortcode || gameId };
            }

            return { status: 400, message: 'Already in a game' };
        }

        if (CompetitiveModes.has(gamemode)) {

            await this.joinCompetitiveQueue(userId, gameInfo);


        } else if (CasualModes.has(gamemode)) {

            return await this.joinCasualQueue(userId, gameInfo);

        } else {
            return { status: 400, message: 'Invalid Game Mode' };
        }

        return { status: 500, message: 'TODO' }; // Placeholder for actual matchmaking logic
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
        });
        console.log(`User ${userId} added to casual queue for game mode ${gamemode}`);

        // For friendly or casual games, we can directly create a game and return the shortcode

        const gameId = await this.CreateGame(gameInfo, [userId]);
        await this.AssignPlayerToGame(gameId, userId);
        return { status: 200, message: gameId };

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
     * @param userId 
     * @returns 
     */
    async QuitGameSearch (userId: string): Promise<void> {
        
        // check if the user is in a game or in a queue
        // if in a game, throw an error
        // if in a queue, remove the user from the queue in redis
        // return void
    },

    /**
     * Function called to create any type of game with the given gamemode and time control.
     * @param gamemode 
     * @param time_control 
     * @returns game UUID in redis
     */
    async CreateGame (gameinfo: GameInfo, players?: string[]): Promise<string> {

        // create a game with the given gamemode and time control

        const r = await redisOps();

        const newGameId = genGameShortcode();
        const gameId = generateUUID();

        await r.game.setInitialMetadata(gameId, {
            state: GameState.SCHEDULED,
            players: players || [],
            gamemode: gameinfo.gamemode,
            startTimestamp: Date.now(),
            base_time: gameinfo.time_control?.base_time,
            increment: gameinfo.time_control?.increment,
            disadvantage: gameinfo.time_control?.disadvantage,
            shortcode: newGameId,
        } as GameMetadata);

        await r.game.setInitialTimedata(gameId);

        // this will be used to create a game for specific players
        // this will also be used to create a game for the matchmaking queue
        // return the game ID

        return gameId;
    },

    async StartGame (gameId: string): Promise<void> {
        // check that the game exists in redis
        const r = await redisOps();
        const game = await r.game.getGameMetadata(gameId);
        if (!game) {
            throw new Error('Game not found');
        }  
        // check that the game is in the scheduled state
        if (game.state !== GameState.SCHEDULED) {
            throw new Error('Game is not in scheduled state');
        }
        // update the game state to in progress
        // change metadata state
        // 

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

    async AssignPlayerToGame (gameId: string, userId: string): Promise<void> {

        // check that the player is not already in a game and exists in the redis players list
        const r = await redisOps();
        const myId = await this.getGameIDOfPlayer(userId);
        if (myId && myId !== gameId) {
            throw new Error('Player is already in a different game');
        }

        const metadata = await r.game.getGameMetadata(gameId);
        if (!metadata) {
            throw new Error('Game not found');
        }

        // check the game is not full
        // assign the player to the game in redis

        const socket = getSocketIO();
        socket.to(userId).emit('gameAssigned', { shortcode: metadata.shortcode });

    },


    async checkPlayerCanJoinGame (userId: string, gameId: string): Promise<boolean> {
        // check that the player is not already in a game and exists in the redis players list
        const r = await redisOps();
        const myId = await this.getGameIDOfPlayer(userId);

        if (myId) return false; // Player is already in a game

        // check the game exists in redis
        const gameMeta = await r.game.getGameMetadata(gameId);
        if (!gameMeta) {
            return false; // Game does not exist
        }
        
        if (gameMeta.gamemode in CasualModes) {

            if (gameMeta.state === GameState.IN_PROGRESS) {
                return true; // spectating is allowed in casual games
            } else {
                return true; // Player can join the game
            }
        }
        return false;
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

    async getGameShortCodeOfPlayer (userId: string): Promise<string | null> {
        const r = await redisOps();
        const game = await r.game.getUserQueueGameId(userId);
        if (!game) return null;

        const gameMeta = await r.game.getGameMetadata(game);
        if (!gameMeta) return null;

        return gameMeta.shortcode || null;
    },









}