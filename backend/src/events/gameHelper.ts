import { dbOperations } from "@/db/operations";
import { genRandomGameKey } from "@/utils/helper";
import { validateTimeControl } from "@/utils/validation";
import { GameInfo, TimeControl } from "@shared/Models/gameInfo";

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
export async function createGame(game_info: string): Promise<string> {
    try {
        const shortCode = genRandomGameKey();
        // Assume uniqueness, conflict chances are low

        // create the game
        const result = await dbOperations.CreateGame(shortCode, game_info);
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