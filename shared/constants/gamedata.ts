
export enum GameMode {
    STANDARD_BLITZ_RANKED = 1,
    STANDARD_BLITZ_CASUAL = 2,
}


// const name = GameMode[id]; // "CLASSIC"
export enum GameState {
    SCHEDULED = 1,
    IN_PROGRESS ,
    ABORTED,
    RED_WIN,
    YELLOW_WIN,
    AGREED_DRAW,
    RED_DISCONNECTED = 10,
    YELLOW_DISCONNECTED,
    RED_RESIGNED,
    YELLOW_RESIGNED,
    RED_TIMEOUT,
    YELLOW_TIMEOUT,
}