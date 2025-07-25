import { GameMode } from "@shared/constants/gamedata";
import { TimeControl } from "@shared/types/game";

export const gameService = {
  
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

    UpdatePlayerElo: async (userId: string, gameId: string): Promise<void> => {
    
        // unsure how to implement for now
        
    },

    GetGameIDByShortCode: async (shortCode: string): Promise<string | null> => {
        // check the game exists in redis
        // return the game ID if it exists, otherwise return null

        return null; // Placeholder for actual logic to get game ID by short code
    }

}