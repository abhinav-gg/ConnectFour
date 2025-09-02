import { GameState } from "../constants/allgamestates";

export const getDescription = (s: GameState): string => {

    return "Errored"
}

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

export const RedWinStates = new Set<GameState>([
    GameState.RED_WIN,
    GameState.YELLOW_DISCONNECTED,
    GameState.YELLOW_RESIGNED,
    GameState.YELLOW_TIMEOUT,
]);

export const YellowWinStates = new Set<GameState>([
    GameState.YELLOW_WIN,
    GameState.RED_DISCONNECTED,
    GameState.RED_RESIGNED,
    GameState.RED_TIMEOUT,
]);

export const DrawStates = new Set<GameState>([
    GameState.DRAW_FULL,
    GameState.AGREED_DRAW,
]);

export const CheckmateStates = new Set<GameState>([
    GameState.RED_WIN,
    GameState.YELLOW_WIN,
]);

export const DisconnectedStates = new Set<GameState>([
    GameState.RED_DISCONNECTED,
    GameState.YELLOW_DISCONNECTED,
]);

export const ResignedStates = new Set<GameState>([
    GameState.RED_RESIGNED,
    GameState.YELLOW_RESIGNED,
]);

export const TimeoutStates = new Set<GameState>([
    GameState.RED_TIMEOUT,
    GameState.YELLOW_TIMEOUT,
]);
