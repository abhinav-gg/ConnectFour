import { GameMode } from "@shared/constants/allgamemodes";
import { TimeControl } from "@shared/types/game";

export const gameService = {
  

    getPlayerElo: async (userId: string, gamemode: GameMode): Promise<number> => {
        // This function should retrieve the player's Elo rating for the specified game mode.
        // check redis cache first

        // if not found, check the database
        // if not found, set to the default (1000 for all gamemodes)
        // add to cache for 1 day

        return 0;
    },









    /**
     * Function called to being matchmaking for a user. If a match is found, it will return the game ID. If not, user will be added to redis queue.
     * @param userId 
     * @param time_control 
     * @param gamemode 
     * @returns 
     */
    LookForRandomMatch: async (userId: string, time_control: TimeControl, gamemode: GameMode): Promise<string | null> => {
        
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
    QuitGameSearch: async (userId: string): Promise<void> => {
        
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
    CreateGame: async (gamemode: GameMode, time_control: TimeControl): Promise<string> => {

        // create a game with the given gamemode and time control
        // return the game ID
        // this will be used to create a game for specific players
        // this will also be used to create a game for the matchmaking queue

        return "gameID"; // Placeholder for actual game creation logic
    },

    /**
     * Store a game from redis into the NOSQL database.
     * @param gameId 
     * @param gameData 
     */
    StoreGame: async (gameId: string): Promise<void> => {

        // check that the game exists in redis

        // Store the game data in the NOSQL database game table
        // For each player in the game, store in the playerdata table

        // remove the game from redis

    },

    AssignPlayerToGame: async (gameId: string, userId: string): Promise<void> => {

        // check that the player is not already in a game and exists in the redis players list
        // check the game is not full
        // assign the player to the game in redis

    },

    UpdatePlayerElo: async (userId: string, mode: number, deltaElo: number): Promise<void> => {
    
        // unsure how to implement for now
        
    },

    GetGameIDByShortCode: async (shortCode: string): Promise<string | null> => {
        // check the game exists in redis
        // return the game ID if it exists, otherwise return null

        return null; // Placeholder for actual logic to get game ID by short code
    },


    ValidGameModeByTimeControl: (gamemode: GameMode, time_control: TimeControl): boolean => {
        
        // Detect friendly game mode

        // Detect custom time control and verify with the gamemode provided.

        // const timeMode = CategoriseTime(time_control);
        // check against gamemodes....
        // TODO
        return true; // Placeholder for actual validation logic
    },



















}