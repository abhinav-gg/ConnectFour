
export enum GameState {
    ERRORED             = 0,
    SCHEDULED           = 1,
    IN_PROGRESS         = 2,
    ABORTED             = 3,
    DRAW_FULL           = 4,
    RED_WIN             = 5,
    YELLOW_WIN          = 6,
    AGREED_DRAW         = 7,
    RED_DISCONNECTED    = 8,
    YELLOW_DISCONNECTED = 9,
    RED_RESIGNED        = 10,
    YELLOW_RESIGNED     = 11,
    RED_TIMEOUT         = 12,
    YELLOW_TIMEOUT      = 13,
}


export const GameStateLabels: Record<GameState, string> = {
    [GameState.ERRORED]            : "Errored",
    [GameState.SCHEDULED]          : "Scheduled",
    [GameState.IN_PROGRESS]        : "In Progress",
    [GameState.ABORTED]            : "Aborted",
    [GameState.DRAW_FULL]          : "Draw (Full)",
    [GameState.RED_WIN]            : "Red Wins",
    [GameState.YELLOW_WIN]         : "Yellow Wins",
    [GameState.AGREED_DRAW]        : "Draw (Agreed)",
    [GameState.RED_DISCONNECTED]   : "Red Disconnected",
    [GameState.YELLOW_DISCONNECTED]: "Yellow Disconnected",
    [GameState.RED_RESIGNED]       : "Red Resigned",
    [GameState.YELLOW_RESIGNED]    : "Yellow Resigned",
    [GameState.RED_TIMEOUT]        : "Red Timeout",
    [GameState.YELLOW_TIMEOUT]     : "Yellow Timeout",
};


export const FinishedGameStates = new Set<GameState>([
    GameState.DRAW_FULL,
    GameState.RED_WIN,
    GameState.YELLOW_WIN,
    GameState.AGREED_DRAW,
    GameState.RED_DISCONNECTED,
    GameState.YELLOW_DISCONNECTED,
    GameState.RED_RESIGNED,
    GameState.YELLOW_RESIGNED,
    GameState.RED_TIMEOUT,
    GameState.YELLOW_TIMEOUT,
]);

