
export enum GameMode {
    
    EMPTY = 0, // 0
    STANDARD_CASUAL = 1, // aka friendly
    STANDARD_BULLET_RANKED,
    STANDARD_BLITZ_RANKED,
    STANDARD_RAPID_RANKED,

    EVENT_GAMEMODES_ERROR = 0xFFFF, // 65535
    // events go in here, e.g. ICH.
}
