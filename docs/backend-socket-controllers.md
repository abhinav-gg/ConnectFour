# Backend Socket Controllers Documentation

## Overview

The Socket controllers handle real-time communication between clients using Socket.IO. They manage live gameplay, matchmaking, spectator features, and real-time notifications.

## Architecture

```
controllers/socket/
├── index.ts              # Socket server setup and configuration
├── handlers.ts           # Common socket event handlers  
├── socketRoomSchema.ts   # Room management and validation
└── routes/
    ├── gameEvents.ts     # Live game event handling
    ├── matchmaking.ts    # Player matchmaking system
    └── waitingRoom.ts    # Pre-game waiting room
```

## Socket Server Setup (`index.ts`)

### Purpose
Initializes Socket.IO server, configures middleware, and sets up event routing.

### Configuration
```typescript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
```

### Middleware Chain
1. **CORS Validation**: Cross-origin request verification
2. **Authentication**: JWT token validation from cookies
3. **Rate Limiting**: Connection and message rate limits
4. **Session Management**: User session attachment
5. **Error Handling**: Connection error management

### Connection Lifecycle
```typescript
io.on('connection', (socket: Socket) => {
  // Attach user context
  // Setup event handlers
  // Join appropriate rooms
  // Handle disconnection cleanup
});
```

## Game Events Controller (`gameEvents.ts`)

### Purpose
Handles real-time game interactions including moves, chat, spectator actions, and game state synchronization.

### Key Events

#### `move` Event
- **Purpose**: Process player moves in real-time
- **Authentication**: Player session required
- **Payload**:
  ```json
  {
    "shortcode": "ABCD12",
    "column": 3,
    "timestamp": 1696118400000
  }
  ```
- **Process**:
  1. Validates player authorization for game
  2. Checks if it's player's turn
  3. Validates move legality (column not full)
  4. Updates game state in Redis
  5. Broadcasts move to all room participants
  6. Triggers bot response if applicable
  7. Checks for win/draw conditions
  8. Updates player statistics if game ends

#### `chat_message` Event
- **Purpose**: Handle in-game chat messages
- **Authentication**: Room participant required
- **Payload**:
  ```json
  {
    "shortcode": "ABCD12",
    "message": "Good game!",
    "type": "game|spectator"
  }
  ```
- **Process**:
  1. Validates message content (profanity filter)
  2. Checks user chat permissions
  3. Applies rate limiting per user
  4. Broadcasts to room participants
  5. Logs message for moderation

#### `request_hint` Event
- **Purpose**: Request move hint from AI analysis
- **Authentication**: Player session required
- **Process**:
  1. Validates hint availability (limit per game)
  2. Analyzes current board position
  3. Calculates best move suggestions
  4. Returns hint with explanation
  5. Decrements available hints

#### `resign` Event
- **Purpose**: Player resignation from active game
- **Authentication**: Player session required
- **Process**:
  1. Validates player is in active game
  2. Updates game state to resigned
  3. Records game result
  4. Updates player statistics
  5. Notifies opponent and spectators
  6. Cleans up game room

### Spectator Features
- **Join Spectating**: `join_spectate` event
- **Spectator Chat**: Separate chat channel
- **Real-time Updates**: Live game state broadcasts
- **Spectator Count**: Display active spectator count

### Game State Synchronization
- **State Broadcasts**: Automatic state updates to all participants
- **Connection Recovery**: Rejoin game rooms on reconnection
- **State Validation**: Server-side validation of all moves
- **Conflict Resolution**: Handle simultaneous action conflicts

## Matchmaking Controller (`matchmaking.ts`)

### Purpose
Manages player queues, game matching, room creation, and lobby systems.

### Key Events

#### `join_queue` Event
- **Purpose**: Add player to matchmaking queue
- **Authentication**: User session or anonymous token
- **Payload**:
  ```json
  {
    "gameMode": "standard",
    "timeControl": {
      "base_time": 600,
      "increment": 5
    },
    "rating_range": {
      "min": 1000,
      "max": 1400
    }
  }
  ```
- **Process**:
  1. Validates game mode and parameters
  2. Checks if player already in queue
  3. Adds to appropriate matchmaking pool
  4. Searches for compatible opponents
  5. Creates game if match found
  6. Notifies players of match status

#### `leave_queue` Event
- **Purpose**: Remove player from matchmaking queue
- **Process**:
  1. Removes player from all active queues
  2. Updates queue statistics
  3. Confirms queue departure

#### `match_found` Event (Server → Client)
- **Purpose**: Notify players when match is found
- **Payload**:
  ```json
  {
    "shortcode": "ABCD12",
    "opponent": {
      "username": "Player2",
      "rating": 1250,
      "pfp": "/avatars/player2.jpg"
    },
    "gameInfo": {
      "mode": "standard",
      "timeControl": {...}
    },
    "playerColor": "red"
  }
  ```

#### `joined` Event (Server → Client)
- **Purpose**: Confirm successful room join
- **Payload**:
  ```json
  {
    "shortcode": "ABCD12",
    "gameinfo": {...},
    "isSpectating": false,
    "isP2Bot": false
  }
  ```

### Matchmaking Algorithm
1. **Pool Segmentation**: Separate queues by game mode and time control
2. **Rating Matching**: Pair players within acceptable rating ranges
3. **Wait Time Expansion**: Gradually expand search criteria over time
4. **Priority Handling**: VIP/premium user priority matching
5. **Bot Fallback**: Offer bot games for long-waiting players

### Queue Management
- **Queue Statistics**: Real-time queue size and wait times
- **Queue Prioritization**: Premium users, event participants
- **Anti-Cheating**: Prevent queue manipulation
- **Geographic Matching**: Prefer geographically close opponents

## Waiting Room Controller (`waitingRoom.ts`)

### Purpose
Manages pre-game lobby where players prepare before game start.

### Key Events

#### `ready` Event
- **Purpose**: Signal player readiness to start game
- **Process**:
  1. Mark player as ready in room
  2. Check if all players ready
  3. Start countdown if all ready
  4. Begin game when countdown expires

#### `chat` Event
- **Purpose**: Pre-game chat in waiting room
- **Similar to game chat but with lobby-specific rules**

#### `customize_settings` Event
- **Purpose**: Adjust game settings (if allowed)
- **Payload**:
  ```json
  {
    "timeControl": {...},
    "boardVariant": "standard"
  }
  ```

### Room States
- **Forming**: Waiting for players to join
- **Ready Check**: Players confirming readiness
- **Starting**: Countdown to game start
- **In Progress**: Game has begun

## Socket Event Handlers (`handlers.ts`)

### Purpose
Common utilities and middleware for socket event processing.

### Key Functions

#### `withNamespace`
- **Purpose**: Apply namespace-specific middleware and routing
- **Features**:
  - Route validation
  - Error handling
  - Event logging
  - Performance monitoring

#### `authenticateSocket`
- **Purpose**: Validate user authentication for socket events
- **Process**:
  1. Extract JWT from socket handshake
  2. Verify token signature and expiration
  3. Attach user context to socket
  4. Handle anonymous users appropriately

#### `validateGameAccess`
- **Purpose**: Check if user can access specific game
- **Validation**:
  - Player participation
  - Spectator permissions
  - Admin access rights
  - Game privacy settings

### Error Handling
```typescript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  socket.emit('error', {
    code: 'SOCKET_ERROR',
    message: 'Connection error occurred'
  });
});
```

## Room Management (`socketRoomSchema.ts`)

### Purpose
Defines room structure, validation, and management utilities.

### Room Types
- **Game Rooms**: Active gameplay sessions
- **Spectator Rooms**: Watching ongoing games
- **Lobby Rooms**: Matchmaking and social areas
- **Private Rooms**: Custom games and tournaments

### Room Schema
```typescript
interface GameRoom {
  shortcode: string;
  players: PlayerSocket[];
  spectators: PlayerSocket[];
  gameState: GameState;
  metadata: GameMetadata;
  created: Date;
  lastActivity: Date;
}
```

### Room Lifecycle
1. **Creation**: Room created when game starts
2. **Population**: Players and spectators join
3. **Activity**: Game events and interactions
4. **Cleanup**: Room cleanup after game ends
5. **Archival**: Room data archived for history

### Security Features
- **Access Control**: Room-based permissions
- **Anti-Cheating**: Move validation and timing checks
- **Rate Limiting**: Per-room message rate limits
- **Moderation**: Admin tools for room management

## Real-time Features

### Live Game Updates
- **Move Animations**: Smooth piece drop animations
- **Turn Indicators**: Real-time turn highlighting
- **Timer Updates**: Live countdown timers
- **State Synchronization**: Instant state updates

### Spectator Experience
- **Live Commentary**: Optional AI move analysis
- **Multiple Views**: Different spectator camera angles
- **Spectator Count**: Display viewer statistics
- **Interactive Features**: Spectator predictions and polls

### Connection Management
- **Reconnection Handling**: Automatic reconnection on disconnect
- **State Recovery**: Restore game state on reconnection
- **Offline Detection**: Handle player disconnections gracefully
- **Heartbeat Monitoring**: Connection health monitoring

## Performance Optimizations

### Message Batching
- **Event Aggregation**: Batch related events together
- **Update Throttling**: Limit update frequency per client
- **Selective Broadcasting**: Send updates only to relevant clients
- **Compression**: Message payload compression

### Memory Management
- **Room Cleanup**: Automatic cleanup of empty rooms
- **Connection Limits**: Per-user connection limits
- **Memory Monitoring**: Track and optimize memory usage
- **Garbage Collection**: Efficient cleanup of unused objects

### Scaling Considerations
- **Horizontal Scaling**: Multi-server socket support
- **Load Balancing**: Distribute connections across servers
- **Session Affinity**: Maintain client-server relationships
- **Database Sharding**: Distribute room data across databases

---

*This documentation covers the real-time Socket.IO controllers. For HTTP REST endpoints, see the API Controllers documentation.*