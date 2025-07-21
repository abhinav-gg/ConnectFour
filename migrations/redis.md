# Redis Key Schema (Readable Format)

# Format: <namespace>:<type>:<identifier>[:subtype]
# Type = String | JSON | Set | List

---

# Auth
email:verify:{token}         | String | 24 hr     | Email verification token
email:reset:{token}          | String | 30 min    | Password reset token

---

# Session
session:user:{userId}        | JSON   | 7 days    | User session object

---

# Cache
cache:user:{userId}          | JSON   | 1 hr      | Cached user profile

---

# 🎮 Live Game (transient game state)
game:live:{gameId}           | JSON   | 24 hours | Full live game state
game:live:{gameId}:meta      | JSON   | 24 hours | Turn, timer, status metadata
game:live:{gameId}:moves     | List   | 24 hours | List of all moves (JSON strings)
game:player:{userId}         | String | 24 hours | User's current active game ID

---

# 🧾 Example Structures

game:live:{gameId} JSON:
{
  players: ["user1", "user2"],
  gameData: "<base64-encoded-binary>",
  gameInfo: 34,
  startTimestamp: 1724127387
}

game:live:meta:{gameId} JSON:
{
  currentTurn: "user1",
  timeoutAt: 1724127400,
  status: "active" // or "ended", "abandoned"
}
