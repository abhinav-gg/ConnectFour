import { dbOperations } from "@/db/operations";
import { genRandomGameKey } from "@/utils/helper";
import { validateTimeControl } from "@/utils/validation";
import { TimeControl } from "@shared/Models/gameInfo";

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
export async function createGame(players: string[], game_info: string) {
    try {
        const shortCode = genRandomGameKey();
        // Assume uniqueness, conflict chances are low

        // create the game
        await dbOperations.CreateGame(shortCode, game_info);
    }
    catch (error) {
        console.log('Failed to create game:', error);
    }
}