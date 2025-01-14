import { GameOperations } from '../db/gameOps';
// file to control all elements of user matchmaking and game creation

// helper functions of the main gameEvents file


// CategoriseTime takes a time control object and returns the game category
// (TODO: define time control object, then function is done)
export function CategoriseTime(timeControl: TimeControl): string { 
    // Calculate total game time in seconds:
    // 2 * base time (both players) + disadvantage + increment * total moves
    const totalTime = (2 * timeControl.baseTime) + timeControl.disadvantage + (timeControl.increment * 30);
    
    // Categorize based on total game time:
    // Hyper Bullet: ≤ 70 seconds (1.16 minutes)
    // Bullet: ≤ 255 seconds (4.25 minutes)
    // Blitz: 256-499 seconds (4.25-8.3 minutes)
    // Rapid: ≥ 500 seconds (8.3+ minutes)
    if (totalTime <= 70) {
        return 'hyper bullet';
    }
    else if (totalTime <= 255) {
        return 'bullet';
    } else if (totalTime < 500) {
        return 'blitz';
    } else {
        return 'rapid';
    }
}
// TODO: figure out what GameOperations is and why it keeps trying to be used for this function
// FindCompetitiveMatch takes the userID and timeControlId and returns a match or null if they need to wait
export async function FindCompetitiveMatch(userId: string, timeControlId: string): Promise<string | null> {
    const gameOps = new GameOperations();
    
    try {
        // First, check if player is already in a game
        const existingGame = await gameOps.GetOngoingGameByPlayer(userId);
        if (existingGame) {
            return existingGame;
        }

        // Add player to matchmaking queue
        await gameOps.BeginFindingGame(userId, timeControlId);

        const client = await gameOps.getClient();
        
        // Look for potential opponents with same time control and closest rating
        // Orders by absolute difference from ideal rating gap (50)
        const potentialMatch = await client.query(
            `WITH user_rating AS (
                SELECT rating FROM con4_schema.Users WHERE id = $1
            )
            SELECT 
                gl.player,
                u.rating,
                ABS(ABS(u.rating - (SELECT rating FROM user_rating)) - 50) as rating_gap
            FROM con4_schema.GameLookup gl
            JOIN con4_schema.Users u ON gl.player = u.id
            WHERE gl.time_control = $2 
                AND gl.player != $1 
                AND gl.game_id IS NULL
            ORDER BY rating_gap ASC
            LIMIT 1`,
            [userId, timeControlId]
        );

        // If we found a match
        if (potentialMatch.rows.length > 0) {
            const opponent = potentialMatch.rows[0];
            const shortCode = generateShortCode();
            
            // Calculate expected scores based on ratings
            const userRating = (await client.query(
                'SELECT rating FROM con4_schema.Users WHERE id = $1',
                [userId]
            )).rows[0].rating;

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

// Helper function to generate a short code for the game
function generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// TODO: GlickoPlayer needs to be stored in the database
interface GlickoPlayer {
    rating: number;
    rd: number;  // Rating Deviation
    lastPlayed: Date;
}

// Calculate new ratings for both players based on Glicko system
function calculateGlickoRatings(player1: GlickoPlayer, player2: GlickoPlayer): [number, number, number, number] {
    const q = Math.log(10) / 400;  // System constant
    
    // Adjust RD based on time since last played (increases uncertainty)
    const adjustRD = (player: GlickoPlayer): number => {
        const daysSinceLastGame = (new Date().getTime() - player.lastPlayed.getTime()) / (1000 * 60 * 60 * 24);
        const newRD = Math.min(350, Math.sqrt(Math.pow(player.rd, 2) + daysSinceLastGame * 5));
        return newRD;
    };

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

    // Calculate new ratings for all scenarios
    const p1WinRating = Math.round(player1.rating + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (1 - E1));
    const p1LossRating = Math.round(player1.rating + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (0 - E1));
    const p2WinRating = Math.round(player2.rating + (q / (1 / Math.pow(p2RD, 2) + 1 / d2)) * g2 * (1 - E2));
    const p2LossRating = Math.round(player2.rating + (q / (1 / Math.pow(p2RD, 2) + 1 / d2)) * g2 * (0 - E2));

    return [p1WinRating, p1LossRating, p2WinRating, p2LossRating];
}


