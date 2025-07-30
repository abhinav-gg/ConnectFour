


export type Player = 0 | 1;
export type Cell = Player | null
export type Move = number

export type TimeInfo = {
    timeTaken: number, 
    allowedTime: number, 
    timeLeft: number,
    delta: number;
};

export type DrawMatrix = {
    confirmAction: boolean,
    acceptAction: boolean,
    offerAction: boolean
}

// export interface AnalysisProps {
//     eval: number
//     nextMoveMade: { column: number; evaluation: number | null }[]
// }

// export type GamePlayer = {
//     username: string;
//     elo: number;
//     time: number;
//     timerActive?: boolean;
// }

export type PlayerData = {
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

export type TimeControl = {
    base_time: number;
    increment: number;
    disadvantage: number;
}


export type TimeCategory = "hyper-bullet" | "bullet" | "blitz" | "rapid";


export type GameInfo = {
    gamemode: number; // GameMode
    time_control: TimeControl;
}


