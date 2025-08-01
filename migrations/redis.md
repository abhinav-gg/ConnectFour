# Redis Key Schema (Readable Format)

# Format: <namespace>:<type>:<identifier>[:subtype]
# Type = String | JSON | Set | List

---

# Auth
email:verify:{email}         | String | 24 hr     | Email verification token
email:reset:{email}          | String | 30 min    | Password reset token

---

# Session
session:user:{userId}        | String   | 7 days    | User session object

---

# Cache
cache:user:{userId}          | JSON   | 1 hr      | Cached user profile

# 🧾 Example Structures

cache:user:{userId}:  JSON:
{
  username: string,                           // current turn for this game
  pfp: number,       // times per move in centiseconds
  elos: Map<number, number>
}

---

# 🎮 Live Game (transient game state)
game:live:{gameId}           | String | 24 hours | Full live game state
game:live:{gameId}:meta      | JSON   | 24 hours | Turn, timer, status metadata
game:live:{gameId}:live      | JSON   | 24 hours | easy to dump and reload for backend


game:queue:{userId}          | JSON | 24 hours | User's current active game ID

---

# 🧾 Example Structures

game:live:{gameId}:meta JSON:
{
  shortcode: "AWUIas7",               // shortcode
  players: ["user1", "user2"],        // array of player IDs, order matters
  startTimestamp: 1724127387,         // Unix timestamp (ms) when game started
  gamemode: 241273872,                // game mode identifier (numeric)
  baseTime: 300000,                   // initial time per player in seconds (e.g., 5 minutes)
  increment: 100,                     // time increment per move in seconds
  disadvantage: 60,                   // time disadvantage in seconds for a player (if any)
  state: 2                            // current game state
}

game:live:{gameId}:live JSON:
{
  cTurn: 0,                           // current turn for this game
  mTimes: [150, 320, 100, ...],       // times per move in centiseconds
  rTimes: [45632, 37912]              // remaining time for each player in centiseconds
  lMove: 1724127387                   // Unix timestamp in ms
  draws: [false, true]                // p2 is extending a draw waiting for response.
}

game:queue:{userId}: JSON:
{
  gameinfo: number,                   // number for the gameinfo (4bytes)
  createdAt: number,                  // time player was added to the queue used for matchmaking
  elo?: number                         // the player's elo in that mode
  gameId?: string,                    // gameId IF THE GAME STARTED
}
