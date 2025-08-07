// 

export const RoomSchema = {
    user: {
        key: (userId: string) => `player:${userId}`,
        pattern: "player:",
    },

    game: {
        key: (shortcode: string) => `game:${shortcode}`,
        pattern: "game:",
    },

    spectating: {
        key: (shortcode: string) => `spectating:${shortcode}`,
        pattern: "spectating:",
    },

    matchmaking: {
        key: (shortcode: string) => `matchmaking:${shortcode}`,
        pattern: "matchmaking:",
    },
  
};