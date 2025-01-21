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
  }

