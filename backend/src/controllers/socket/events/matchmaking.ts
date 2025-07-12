import { dbOperations } from '@/db/operations';
import { GameMode, TimeControl } from '@shared/Models/gameInfo';
import { eventEmitter } from '@shared/utils/eventEmitter';
import { assignGame, createGame, safeGetElo } from './gameHelper';

// file to control all elements of user matchmaking and game creation


// bellow needs to be re-written with Redis


export async function FindCompetitiveMatch(userId: string, time_control: TimeControl, gamemode: GameMode, priority: number): Promise<string | null> {

    // Can safely assume the player is not in a game (checked before call)
    try {
        // Add player to matchmaking queue
        const gamemodeId = await dbOperations.GetGameModeID(gamemode);
        const timeControlId = await dbOperations.GetExactTimeControl(time_control);
        const game_info = await dbOperations.GetGameInfoID(gamemodeId, timeControlId);
        const playerElo = await safeGetElo(userId, gamemodeId);
        
        await dbOperations.BeginFindingGame(userId, game_info);

        const potentialMatch = await dbOperations.QueryMatckmaking(userId, game_info);
        console.log('Potential Matches:', potentialMatch, priority);
        
        // If we found a match
        if (potentialMatch) {

            // Check time current player has been in queue

            // ADJUST AS NEEDED:
            // If they have been waiting >10 seconds, create the game
            // If opponent elo diff is <30, create the game
            if (priority >= 10 || Math.abs(playerElo.elo - potentialMatch.elo) <= 30) {
                // Calculate expected scores based on ratings
                const game = await createGame(gamemode, time_control);

                // TODO: add a switch case on the gamemode to assign the player numbers

                const thisPNum = Math.random() > 0.5 ? 0 : 1;
                await assignGame(game.id, userId, thisPNum);
                await assignGame(game.id, potentialMatch.user_id, Math.abs(thisPNum - 1));
                try {
                    eventEmitter.pub("SendToRoom", { 
                        userId: potentialMatch.user_id, 
                        roomId: game.short_id 
                    });
                } catch (error) {
                    console.error('Failed to send user to room:', error);
                }
                return game.short_id;
            }
            else {
                console.log("Not good enough match, waiting for better match");
            }
        } 
        // Nobody is playing the same game mode, wait for a match
        return null;

    } catch (error) {
        console.error('Error in FindCompetitiveMatch:', error);
        // Clean up the game lookup entry if there was an error
        throw error;
    }
}


// Values used in calculation
const skillRange = 10;
const eloRange = 400;
const maxEloChange = 32;
// This means a player 400 elo higher has a 10x higher winning chance
// These calculations were derived by Arpad Elo based on Bell curves

export function calculatePredictedScore(p1Elo: number, p2Elo: number) {
    const deltaElo = (p2Elo - p1Elo) / eloRange
    return 1/(1 + Math.pow(skillRange, deltaElo))
}

export function calculateUpdatedElo (p1Elo: number, p2Elo: number, result: number) {
    return p1Elo + maxEloChange * (result - calculatePredictedScore(p1Elo, p2Elo))
}

//



///////////////////////////////////////////////////////////////////////////


// TODO: GlickoPlayer needs to be stored in the database

// export const adjustRD = (player: Glicko): number => {
//     return 350;
//     // Calculate the number of days since the player’s rating was last updated
//     const d = (Date.now() - player.updated_at) / (1000 * 60 * 60 * 24);
//     const rd = player.rating_deviation
//     const c = Math.pow(rd, -2) + Math.pow(d, -2);
//     return Math.sqrt(1/(c))
// };


// Calculate new ratings for both players based on Glicko system
// export function calculateGlickoRatings(me: Glicko, them: Glicko): EloChange {
//     const q = Math.log(10) / 400;  // System constant
    
//     // Adjust RD based on time since last played (increases uncertainty)
    

//     const p1RD = adjustRD(me);
//     const p2RD = adjustRD(them);

//     // // Calculate g-factor (impact of rating deviation on updates)
//     // const g1 = 1 / Math.sqrt(1 + 3 * Math.pow(q, 2) * Math.pow(p2RD, 2) / Math.pow(Math.PI, 2));
//     // const g2 = 1 / Math.sqrt(1 + 3 * Math.pow(q, 2) * Math.pow(p1RD, 2) / Math.pow(Math.PI, 2));

//     // // Calculate expected scores
//     // const E1 = 1 / (1 + Math.pow(10, g1 * (them.elo - me.elo) * p2RD / 400));
//     // const E2 = 1 / (1 + Math.pow(10, g2 * (me.elo - them.elo) * p1RD / 400));

//     // // Calculate rating changes for win/loss
//     // const d1 = 1 / (Math.pow(q, 2) * Math.pow(g1, 2) * E1 * (1 - E1));
//     // const d2 = 1 / (Math.pow(q, 2) * Math.pow(g2, 2) * E2 * (1 - E2));

//     // Calculate new ratings for all scenarios and round to 2 decimal places
//     // For draws, use 0.5 as the score (halfway between 0 and 1)
//     const ratingChanges: EloChange = {
//         win : 20,
//         loss : -20,
//         draw : 0,
//     };
//     return ratingChanges;
// }

