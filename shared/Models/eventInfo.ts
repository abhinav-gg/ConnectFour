/////////////////////////////////////////////////////////
import { ICHACK25 } from "@shared/events";

export type hackspace = "QTR" | "SCR" | "JCR";

export type ICHackLeaderboardPlayer = {
    rank: number;
    username: string;
    name: string;
    elo: number;
    hackspace: hackspace;
};

export type ICHacker = {
    id: string;
    name: string;
    hackspace: hackspace;
}