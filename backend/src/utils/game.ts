
import { UUID } from "crypto";
import { TimeControl, TimeCategory } from "@shared/types/game";
import { EloChange } from "@shared/types/game";
// Convert UUID string to Buffer (16 bytes)


export function genGameShortcode(): string {
  // return a random 8 character string with numbers and letters (case sensitive)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
  let key = "";
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}


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

export const preferredDeltaElo = 20;

export function getQueuePriority(timeSinceQueued: number, deltaElo: number): number {
    let timePriority = 0;
    // scale by time difference squared
    if (timeSinceQueued > 10000) {
        timePriority = Math.pow((timeSinceQueued + 100) * 0.001, 1.7);
    } else {
        timePriority = Math.pow((timeSinceQueued + 100) * 0.001, 1.5);
    }

    // scale strongly by inverse of the elo difference (aim for the preferred delta)
    let dE = deltaElo - preferredDeltaElo
    if (dE < 0) {
        // this should be weighted stronger than positive differences
        dE = Math.abs(dE) / 4;
    }
    const eloPriority = 1 / (dE + 1);

    return timePriority * eloPriority;
}


