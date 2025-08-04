


export type Player = 0 | 1;
export type Cell = Player | null
export type Move = number
export type Seconds = number

export type TimedMoveResult = { 
    success: boolean, 
    row?: number; 
    deltaTime?: number
 }


// export interface AnalysisProps {
//     eval: number
//     nextMoveMade: { column: number; evaluation: number | null }[]
// } 

export type EloChange = {
    win: number;
    draw: number;
    loss: number;
}

export type TimeControl = {
    base_time: Seconds;
    increment: Seconds;
    disadvantage: Seconds;
}

export type TimeCategory = "hyper-bullet" | "bullet" | "blitz" | "rapid";

export type GameInfo = {
    gamemode: number; // GameMode
    time_control: TimeControl;
}


