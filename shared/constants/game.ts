export const ROWS = 6;
export const COLS = 7;


export const AvgGameLength = 30; // idk what this is for

export const StandardStartingElo = 1000;

export const StandardReconnectionTime = 20 * 1000; // 15 seconds

export const MaxBaseTime = 3 * 60 * 60; // 3 hours in seconds
export const MaxIncrement = 3 * 60; // 3 minutes in seconds
export const MaxDisadvantage = 3 * 60; // 3 minutes in seconds

export enum MoveClassification {
    BOOK,
    BLUNDER,
    MISS,
    MISTAKE,
    GOOD,
    BEST,
    GREAT,
    BRILLIANT
}

// Add inaccuracy and excellent classifications in the future when making monte carlo engine
