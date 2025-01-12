type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type GameInfo = {
    id: UUID;
    gamemode: UUID;
    time_control: UUID;
};

export type GameMode = {
    id: UUID;
    name: string;
    event: UUID;
};