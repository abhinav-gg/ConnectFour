type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type GameInfo = {
    gamemode: GameMode;
    time_control: TimeControl;
};

export type GameMode = {
    name: string;
    event: UUID;
};

export type TimeControl = {
    base_time: number;
    increment: number;
    disadvantage: number;
}



