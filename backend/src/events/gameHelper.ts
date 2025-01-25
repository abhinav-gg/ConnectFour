import { PlayerEloNotFound } from "@/db/dbErrors";
import { dbOperations } from "@/db/operations";
import { Game, Move } from "@/models/Game";
import { TimeInfo } from "@/types/types";
import { genRandomGameKey } from "@/utils/helper";
import { validateTimeControl } from "@/utils/validation";
import { GameInfo, GameMode, TimeControl } from "@shared/Models/gameInfo";

export async function quitGameSearch(userId: string) {
    try {
        await dbOperations.FinishedGameLookup(userId);
    }
    catch (error) {
        console.log('Failed to remove user from game search:', error);
    }
}

/**
 * Enters the user into the game lookup table
 * This is for competitive games where the user did not get a match. AKA waiting room function.
 * @param userId The user ID
 * @param gameModeId The game mode ID
 * @param timeControl The time control
 * 
 * @returns void
 */
export async function enterGameSearch(userId: string, gameModeId: string, timeControl: TimeControl) {
    try {
        if (!validateTimeControl(timeControl)) {
            throw new Error('Invalid time control');
        }
        const timeID = await dbOperations.GetExactTimeControl(timeControl);
        const gameInfoID = await dbOperations.GetGameInfoID(gameModeId, timeID);
        await dbOperations.BeginFindingGame(userId, gameInfoID);
    }
    catch (error) {
        console.log('Failed to add user to game search:', error);
    }
}

// Create a game for specific players
export async function createGame(gamemode: GameMode, time_control: TimeControl): Promise<Game> {
    try {
        const gameModeID = await dbOperations.GetGameModeID(gamemode);
        const timeControlID = await dbOperations.GetExactTimeControl(time_control);

        if (!gameModeID || !timeControlID) {
            throw new Error('GameModes or TimeControl not found');
        }

        const gameInfoID = await dbOperations.GetGameInfoID(gameModeID, timeControlID);
        
        console.log('Creating game with:', gameInfoID);
        // Assume uniqueness, conflict chances are low
        const shortCode = genRandomGameKey();

        // create the game
        return await dbOperations.CreateGame(shortCode, gameInfoID);
    }
    catch (error) {
        console.log('Failed to create game:', error);
        throw error;
    }
}


// Fetch the GameInfo from the game shortcode
export async function getGameInfo(shortCode: string): Promise<GameInfo> {
    try {
        const time_control = await dbOperations.GetTimeControlFromShortCode(shortCode);
        const gamemode = await dbOperations.GetGameModeFromShortCode(shortCode);
        return { time_control, gamemode } as GameInfo;
    }
    catch (error) {
        console.error('Failed to fetch game info:', error);
        throw error;
    }
}

export async function assignGame(gameId: string, userId: string, num: number) {
    try {
        // This does both the gameplayer assignment and the lookup updating
        await dbOperations.AssignGame(gameId, userId, num);
    }
    catch (error) {
        console.log('Failed to assign game:', error);
        throw error;
    }
}

export async function finishPlayerGame(userId: string) {
    try {
        await dbOperations.FinishedGameLookup(userId);
    }
    catch (error) {
        console.log('Failed to finish player game:', error);
        throw error; // kinda strange error
    }
}

export async function abortGame(userId: string) {
    try {
        const game = await dbOperations.GetGameByPlayerLookup(userId);
        if (!game) {
            throw new Error('Game not found');
        }
        //Update the game lookup here
        //Delete the game player entry here
        await dbOperations.UnassignGame(game, userId);
    }
    catch (error) {
        console.log('Failed to abort game:', error);
        throw error;
    }
}

export async function killGame(gameId: string) {
    try {
        //await dbOperations.KillGame(gameId);
    }
    catch (error) {
        console.log('Failed to kill game:', error);
        throw error;
    }
}

export function calculateTimesByMoves(moves: Move[], userId: string, timecontrol: TimeControl, hasDisadvantage: boolean) {
    
    if (moves.length === 0) {
        return {timeTaken: 0, allowedTime: timecontrol.base_time * 60000, timeLeft: timecontrol.base_time * 60000, delta: 0} as TimeInfo;
    }
    
    let timeTaken = 0; // calculate time taken
    let allowedTime = 0; // get allowed time from time control
    const movesByPlayer = moves.filter(m => m.player === userId);
    timeTaken = movesByPlayer.reduce((acc, m) => acc + m.delta, 0);

    if (hasDisadvantage) {
        allowedTime += timecontrol.disadvantage * 1000;
    }
    allowedTime += (timecontrol.base_time * 60000)
                +  (timecontrol.increment * movesByPlayer.length * 1000);

    const lastMoveMadeTime = moves[moves.length - 1].played_at * 1000; // db stores in seconds
    const currentTime = new Date().getTime(); // debug this
    const delta = currentTime - lastMoveMadeTime;
    const timeLeft = allowedTime - timeTaken - delta + timecontrol.increment * 1000;
    return {timeTaken, allowedTime, timeLeft, delta} as TimeInfo;
}
