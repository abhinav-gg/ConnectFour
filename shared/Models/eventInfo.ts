
export type leaderboardPlayer = {
    rank: number;
    username: string;
    elo: number;
}




/////////////////////////////////////////////////////////
import { ICHACK25 } from "@shared/events";

export type hackspace = "QTR" | "SCR" | "JCR";

export type ICHackLeaderboardPlayer = {
    rank: number;
    username: string;
    fullname: string;
    elo: number;
    hackspace: hackspace;
};

export type ICHacker = {
    user_id: string;
    id: string;
    name: string;
    hackspace: hackspace;
}