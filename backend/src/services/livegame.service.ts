
export const gameService = {


    AbortGame: async (userId: string, shortcode: string): Promise<void> => {

        // check the player is in the correct game in redis

        // check the game status has not started

        // terminate the game with result aborted and sent socketio code to both players
        // remove the game from redis
    },

    HandleDisconnect: async (userId: string, shortcode: string): Promise<void> => {



    },

    AttemptDraw: async (userId: string, shortcode: string): Promise<void> => {    
        
        // if game state is ended do nothing
        // if already offering draw and opponent has not accepted do nothing

        // if opponent is offering draw, accept the draw and end the game

        // if opponent is not offering draw, send a draw offer to the opponent
        
        // otherwise do nothing
    },

    SafeResign: async (userId: string, shortcode: string): Promise<void> => {

        // if game state is ended do nothing

        // current player resigns the game, end and store the game

        // otherwise do nothing
    },

}