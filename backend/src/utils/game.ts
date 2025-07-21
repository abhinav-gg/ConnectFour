
import { UUID } from "crypto";
import { TimeControl, TimeCategory } from "@shared/types/game";
import { EloChange } from "@shared/types/game";
// Convert UUID string to Buffer (16 bytes)


export function genRandomGameKey(): string {
  // return a random 8 character string with numbers and letters (case sensitive)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
  let key = "";
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}



// CategoriseTime takes a time control object and returns the game category
// (TODO: define time control object, then function is done)
export function CategoriseTime(timeControl: TimeControl): TimeCategory { 
    // Calculate total game time in seconds:
    // 2 * base time (both players) + disadvantage + increment * total moves

    const totalTime = (2 * 60 * timeControl.base_time) + 
                        timeControl.disadvantage + (timeControl.increment * 30);
    
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

// import { randomUUID } from 'crypto';

// // 1. Generate UUID string
// const uuidStr = randomUUID();
// console.log('UUID String:', uuidStr);

// // 2. Convert to Buffer (16 bytes)
// const uuidBuf = uuidToBuffer(uuidStr);
// console.log('UUID Buffer:', uuidBuf);

// // 3. Store uuidBuf in DynamoDB as binary attribute

// // 4. Convert back to string when reading
// const uuidStrBack = bufferToUuid(uuidBuf);
// console.log('Recovered UUID String:', uuidStrBack);


// Values used in calculation
const skillRange = 10;
const eloRange = 400;
const maxEloChange = 32;
const drawScore = 0.35; // The score for a draw in Elo calculations
// This means a player 400 elo higher has a 10x higher winning chance
// These calculations were derived by Arpad Elo based on Bell curves

export function calculatePredictedScore(p1Elo: number, p2Elo: number) {
    const deltaElo = (p2Elo - p1Elo) / eloRange
    return 1/(1 + Math.pow(skillRange, deltaElo))
}

/**
 * 
 * @param p1Elo elo of player 1 
 * @param p2Elo elo of player 2
 * @param result result represents the actual outcome of the match from player 1's perspective. It’s typically a number between 0 and 1:
 * 1 means player 1 won the match.
 * 0.5 means the match was a draw.
 * 0 means player 1 lost the match.
 * @returns 
 */
export function calculateUpdatedElo (pElo: number, opponentElo: number, result: number) {
    return pElo + maxEloChange * (result - calculatePredictedScore(pElo, opponentElo))
}

export function calculateEloChanges(pElo: number, opponentElo: number, pIsRed: boolean): EloChange {
    const predictedScore = calculatePredictedScore(pElo, opponentElo);
    const drawPred = pIsRed ? drawScore : 1 - drawScore;

    return {
        win:  maxEloChange * (1 - predictedScore),
        draw: maxEloChange * (drawPred - predictedScore),
        loss: maxEloChange * (0 - predictedScore)
    };
}


export function calculateTimesByMoves(moves: any[], userId: string, timecontrol: TimeControl, hasDisadvantage: boolean) {
    
}



