import { dbOperations } from "@/db/operations";
import { Game } from "@/models/Game";
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

//
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
        const gameInfoID = await dbOperations.GetGameInfoID(gameModeID, timeControlID);
        
        console.log('Creating game with:', gameInfoID);
        // Assume uniqueness, conflict chances are low
        const shortCode = genRandomGameKey();

        // create the game
        const result = await dbOperations.CreateGame(shortCode, gameInfoID);
        return result;
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

export async function assignGame(gameId: string, userId: string, num: number, dElo: number) {
    try {
        // This does both the gameplayer assignment and the lookup updating
        await dbOperations.AssignGame(gameId, userId, num, dElo);
    }
    catch (error) {
        console.log('Failed to assign game:', error);
        throw error;
    }
}

export async function finishGame(gameId: string) {
    // try {
    //     await dbOperations.FinishGame(gameId);
    // }
    // catch (error) {
    //     console.log('Failed to finish game:', error);
    //     throw error;
    // }
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