import { getSocketIO } from "@/controllers/socket";
import { redisOps } from "@/redis/ops";

export const liveGameService = {
    

    async AbortGame(userId: string): Promise<void> {

        // check the player is in the correct game in redis

        // check the game status has not started

        // terminate the game with result aborted and sent socketio code to both players
        // remove the game from redis
    },

    async HandleDisconnect(userId: string): Promise<void> {

        const r = await redisOps();
        const gameId = await r.game.getUserQueueGameId(userId);

        const socket = getSocketIO();
        // if the user was in a game then this becomes a bit of a problem

    },

    async AttemptDraw(userId: string): Promise<void> {    
        
        // if game state is ended do nothing
        // if already offering draw and opponent has not accepted do nothing

        // if opponent is offering draw, accept the draw and end the game

        // if opponent is not offering draw, send a draw offer to the opponent
        
        // otherwise do nothing
    },

    async ConfirmDraw(userId: string): Promise<void> {
        // if game state is ended do nothing

        // if opponent is offering draw, accept the draw and end the game

        // otherwise do nothing
    },

    async Resign(userId: string): Promise<void> {

        // if game state is ended do nothing

        // current player resigns the game, end and store the game

        // otherwise do nothing
    },

}