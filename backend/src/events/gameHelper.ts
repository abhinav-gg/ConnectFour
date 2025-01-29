import { PlayerEloNotFound } from "@/db/dbErrors";
import { dbOperations } from "@/db/operations";
import { Game, Move } from "@/models/Game";
import { Glicko, TimeInfo } from "@/types/types";
import { genRandomGameKey } from "@/utils/helper";
import { validateTimeControl } from "@/utils/validation";
import { AvgGameLength, StandardGameStates, StandardStartingElo, StandardStartingRatingDeviation } from "@shared/constants";
import { GameInfo, GameMode, TimeControl } from "@shared/Models/gameInfo";
import { adjustRD, calculateGlickoRatings } from "./matchmaking";

export async function quitGameSearch(userId: string) {
    try {
        const gameId = await dbOperations.GetGameByPlayerLookup(userId);
        if (!gameId) {
            throw new Error('Game not found');
        }
        const game = await dbOperations.GetGameByID(gameId);
        if (game.state === StandardGameStates.ongoing) {
            throw new Error('Game is ongoing');
        } else if (game.state === StandardGameStates.scheduled) {
            await dbOperations.UnassignGame(gameId, userId);
        }
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

export async function abortGame(userId: string) {
    // user did not play a single move
    try {
        const game = await dbOperations.GetGameByPlayerLookup(userId);
        if (!game) {
            throw new Error('Game not found');
        }
        //Update the game lookup here
        await dbOperations.FinishedGameLookup(userId);
        //Delete the game player entry here
        await dbOperations.UnassignGame(game, userId);
    }
    catch (error) {
        console.log('Failed to abort game:', error);
        throw error;
    }
}

// CategoriseTime takes a time control object and returns the game category
// (TODO: define time control object, then function is done)
export function CategoriseTime(timeControl: TimeControl): string { 
    // Calculate total game time in seconds:
    // 2 * base time (both players) + disadvantage + increment * total moves

    const totalTime = (2 * 60 * timeControl.base_time) + timeControl.disadvantage + (timeControl.increment * AvgGameLength);
    
    // Categorize based on total game time:
    // Hyper Bullet: ≤ 70 seconds (1.16 minutes)
    // Bullet: ≤ 255 seconds (4.25 minutes)
    // Blitz: 256-650 seconds (4.25-8.3 minutes)
    // Rapid: ≥ 650 seconds (8.3+ minutes)
    if (totalTime <= 70) {
        return 'hyper-bullet';
    } else if (totalTime <= 255) {
        return 'bullet';
    } else if (totalTime <= 650) {
        return 'blitz';
    } else {
        return 'rapid';
    }
}

export async function safeGetElo(userId: string, gamemodeId: string): Promise<Glicko> {
    let playerElo: Glicko;
    try {
        playerElo = await dbOperations.GetPlayerStats(userId, gamemodeId)
    } catch (error) {
        if (error instanceof PlayerEloNotFound) {
            await dbOperations.SafeCreateElo(userId, gamemodeId, StandardStartingElo, StandardStartingRatingDeviation);
            playerElo = { 
                elo: StandardStartingElo, 
                rating_deviation: StandardStartingRatingDeviation , 
                updated_at: Date.now() } as Glicko;
        } else {
            throw error;
        }
    }
    return playerElo;
}

export function calculateTimesByMoves(moves: Move[], userId: string, timecontrol: TimeControl, hasDisadvantage: boolean) {
    
    if (moves.length === 0) {
        const time = timecontrol.base_time * 60000 + (hasDisadvantage ? timecontrol.disadvantage * 1000 : 0);
        return {
            timeTaken: 0, 
            allowedTime: time, 
            timeLeft: time, 
            delta: 0} as TimeInfo;
        const time = timecontrol.base_time * 60000 + (hasDisadvantage ? timecontrol.disadvantage * 1000 : 0);
        return {
            timeTaken: 0, 
            allowedTime: time, 
            timeLeft: time, 
            delta: 0} as TimeInfo;
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
    const timeLeft = allowedTime - timeTaken - delta;
    return {timeTaken, allowedTime, timeLeft, delta} as TimeInfo;
}

export async function endGame(short_id: string, gamemode: GameMode, draw: boolean, winner?: number): Promise<void> {
    try {
        const game = await dbOperations.GetGameByShortCode(short_id);
        const gamemodeid = await dbOperations.GetGameModeID(gamemode);
        if (!game) {
            throw new Error('Game not found???');
        }
        if (draw) {
            await dbOperations.UpdateGameStatusByShortCode(short_id, StandardGameStates.draw);
        } else {
            await dbOperations.UpdateGameStatusByShortCode(short_id, `win: ${winner}`);
        }

        const gamePlayers = await dbOperations.GetPlayersByShortCode(short_id);
        switch (gamemode.name.split('-')[0]) {
            case 'standard':
                const p1Stats = await safeGetElo(gamePlayers[0], gamemodeid) as Glicko;
                const p2Stats = await safeGetElo(gamePlayers[1], gamemodeid) as Glicko;
                const p1Changes = calculateGlickoRatings(p1Stats, p2Stats);
                const p2Changes = calculateGlickoRatings(p2Stats, p1Stats);
                const p1rd = adjustRD(p1Stats);
                const p2rd = adjustRD(p2Stats);
                dbOperations.UpdateRD(gamePlayers[0], gamemodeid, p1rd);
                dbOperations.UpdateRD(gamePlayers[1], gamemodeid, p2rd);
                let p1Delta, p2Delta;
                if (draw) {
                    p1Delta = p1Changes.draw;
                    p2Delta = p2Changes.draw;
                } else if (winner === 0) {
                    p1Delta = p1Changes.win;
                    p2Delta = p2Changes.loss;
                } else {
                    p1Delta = p1Changes.loss;
                    p2Delta = p2Changes.win;
                }

                dbOperations.UpdateElo(gamePlayers[0], gamemodeid, p1Delta);
                dbOperations.UpdateElo(gamePlayers[1], gamemodeid, p2Delta);
                break;                
        }
        gamePlayers.forEach(async (player) => {
            await dbOperations.FinishedGameLookup(player);
        });
    }
    catch (error) {
        console.log('Failed to end game:', error);
        throw error;
    }
}

