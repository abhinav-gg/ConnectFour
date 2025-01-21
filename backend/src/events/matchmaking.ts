import { GameMode, TimeControl } from '@shared/Models/gameInfo';
import { dbOperations } from '@/db/operations';
// file to control all elements of user matchmaking and game creation

// helper functions of the main gameEvents file


// CategoriseTime takes a time control object and returns the game category
// (TODO: define time control object, then function is done)
export function CategoriseTime(timeControl: TimeControl): string { 
    // Calculate total game time in seconds:
    // 2 * base time (both players) + disadvantage + increment * total moves
    const avgGameLength = 30;  // Average game length in moves
    const totalTime = (2 * 60 * timeControl.base_time) + timeControl.disadvantage + (timeControl.increment * avgGameLength);
    
    // Categorize based on total game time:
    // Hyper Bullet: ≤ 70 seconds (1.16 minutes)
    // Bullet: ≤ 255 seconds (4.25 minutes)
    // Blitz: 256-499 seconds (4.25-8.3 minutes)
    // Rapid: ≥ 500 seconds (8.3+ minutes)
    if (totalTime <= 70) {
        return 'hyper bullet';
    } else if (totalTime <= 255) {
        return 'bullet';
    } else if (totalTime < 500) {
        return 'blitz';
    } else {
        return 'rapid';
    }
}
// TODO: figure out what GameOperations is and why it keeps trying to be used for this function
// FindCompetitiveMatch takes the userID and timeControlId and returns a match or null if they need to wait
export async function FindCompetitiveMatch(userId: string, time_control: TimeControl, gamemode: GameMode): Promise<string | null> {
    
    try {
        // First, check if player is already in a game
        const existingGame = await dbOperations.GetGameByPlayerLookup(userId);
        if (existingGame) {
            return existingGame;
        }

        // Add player to matchmaking queue
        //await dbOperations.BeginFindingGame(userId,);
        
        // Look for potential opponents with same time control and closest rating
        // Orders by absolute difference from ideal rating gap (50)
        const potentialMatch = dbOperations.QueryMatckmaking(userId, gamemodeId);

        // If we found a match
        if (potentialMatch.rows.length > 0) {
            const opponent = potentialMatch.rows[0];

            // Check time current player has been in queue
            // If they have been waiting <20 seconds and opponent elo diff is >50, keep waiting
            // If they have been waiting >20 seconds, create the game
            // If opponent elo diff is <50, create the game

            
            // Calculate expected scores based on ratings
            const userRating = dbOperations.GetPlayerElo(userId, gamemodeId);

            // Calculate expected scores (1 for win, 0 for loss)
            const expectedScore = 1 / (1 + Math.pow(10, (opponent.rating - userRating) / 400));
            
            // Create the game
            await gameOps.CreateGame(
                shortCode,
                userId,
                opponent.player,
                timeControlId,
                expectedScore,           // Expected score for player 1
                1 - expectedScore       // Expected score for player 2
            );

            return shortCode;
        }

        // No match found
        return null;

    } catch (error) {
        console.error('Error in FindCompetitiveMatch:', error);
        // Clean up the game lookup entry if there was an error
        await gameOps.FinishedGameLookup(userId);
        throw error;
    }
}


// TODO: GlickoPlayer needs to be stored in the database
export interface GlickoPlayer {
    rating: number;
    rd: number;  // Rating Deviation
    timeSinceLastPlayed: number;
}

interface GlickoRatingChange {
    p1W: number;
    p1L: number;
    p1D: number;
    p2W: number;
    p2L: number;
    p2D: number;
}

export const adjustRD = (player: GlickoPlayer): number => {
    const daysSinceLastGame = (player.timeSinceLastPlayed) / (1000 * 60 * 60 * 24);
    const newRD = Math.min(350, Math.sqrt(Math.pow(player.rd, 2) + daysSinceLastGame * 5));
    return newRD;
};

// Calculate new ratings for both players based on Glicko system
export function calculateGlickoRatings(player1: GlickoPlayer, player2: GlickoPlayer): GlickoRatingChange {
    const q = Math.log(10) / 400;  // System constant
    
    // Adjust RD based on time since last played (increases uncertainty)
    

    const p1RD = adjustRD(player1);
    const p2RD = adjustRD(player2);

    // Calculate g-factor (impact of rating deviation on updates)
    const g1 = 1 / Math.sqrt(1 + 3 * Math.pow(q, 2) * Math.pow(p2RD, 2) / Math.pow(Math.PI, 2));
    const g2 = 1 / Math.sqrt(1 + 3 * Math.pow(q, 2) * Math.pow(p1RD, 2) / Math.pow(Math.PI, 2));

    // Calculate expected scores
    const E1 = 1 / (1 + Math.pow(10, g1 * (player2.rating - player1.rating) / 400));
    const E2 = 1 / (1 + Math.pow(10, g2 * (player1.rating - player2.rating) / 400));

    // Calculate rating changes for win/loss
    const d1 = 1 / (Math.pow(q, 2) * Math.pow(g1, 2) * E1 * (1 - E1));
    const d2 = 1 / (Math.pow(q, 2) * Math.pow(g2, 2) * E2 * (1 - E2));

    // Calculate new ratings for all scenarios and round to 2 decimal places
    // For draws, use 0.5 as the score (halfway between 0 and 1)
    const ratingChanges: GlickoRatingChange = {
        p1W : Number((player1.rating + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (1 - E1)).toFixed(2)),
        p1L : Number((player1.rating + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (0 - E1)).toFixed(2)),
        p1D : Number((player1.rating + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (0.5 - E1)).toFixed(2)),
        p2W : Number((player2.rating + (q / (1 / Math.pow(p2RD, 2) + 1 / d2)) * g2 * (1 - E2)).toFixed(2)),
        p2L : Number((player2.rating + (q / (1 / Math.pow(p2RD, 2) + 1 / d2)) * g2 * (0 - E2)).toFixed(2)),
        p2D : Number((player2.rating + (q / (1 / Math.pow(p2RD, 2) + 1 / d2)) * g2 * (0.5 - E2)).toFixed(2))
    
    };
    return ratingChanges;
}
