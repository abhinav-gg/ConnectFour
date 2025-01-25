type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type GameInfo = {
    gamemode: GameMode;
    time_control: TimeControl;
};

export type GameMode = {
    name: string;
    event: UUID | null;
};

export type TimeControl = {
    base_time: number;
    increment: number;
    disadvantage: number;
}

export type SendToRoom = {
    event: 'sendToRoom';
    data: { roomId: UUID; };
}

export type GamePlayer = {
    username: string;
    elo: number;
    time: number;
    timerActive?: boolean;
}

export interface PlayerData {
    username: string;
    time: number;
};

export type EloChange = {
    win: number;
    draw: number;
    loss: number;
}

export type GMStats = {
    elo: number;
    rating_deviation: number;
}

export interface ChatMessage {
    playerNumber: number;
    username: string;
    message: string;
    isAnnouncement: boolean;
}

