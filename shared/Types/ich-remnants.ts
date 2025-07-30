
export type leaderboardPlayer = {
    rank: number;
    username: string;
    elo: number;
}

export type hackspace = "qtr" | "scr" | "jcr";

export type ICHackLeaderboardPlayer = {
    rank: number;
    username: string;
    fullname: string;
    elo: number;
    hackspace: hackspace;
};

export type ICHacker = {
    user_id: string; // con4 user id (?)
    id: string; // ICH id (must confirm)
    name: string; // full name
    hackspace: hackspace; // hackspace room at ICH
}