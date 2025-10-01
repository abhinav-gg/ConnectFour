# Backend Database Layer Documentation

## Overview

The database layer provides data persistence and caching for the ConnectFour application using a multi-database architecture optimized for different data access patterns and performance requirements.

## Architecture

```
db/
├── dynamodb/              # NoSQL for game history and analytics
│   ├── dynamoClient.ts    # AWS DynamoDB client setup
│   ├── dynamoTables.ts    # Table definitions and schemas
│   ├── ops.ts             # DynamoDB operations
│   └── tables/
│       └── gameOps.ts     # Game-specific DynamoDB operations
├── rds/                   # Relational database for user data
│   ├── rdsClient.ts       # PostgreSQL client setup
│   ├── ops.ts             # RDS operations interface
│   ├── repositories/      # Data access layer
│   │   ├── adminOps.ts    # Admin operations
│   │   ├── eventsOps.ts   # Events and tournaments
│   │   └── userOps.ts     # User management operations
│   └── utils/
│       ├── withDbClient.ts # Database client utilities
│       └── withTransaction.ts # Transaction management
└── models/
    ├── Game.ts            # Game entity models
    └── User.ts            # User entity models
```

## Redis Layer (`redis/`)

### Purpose
High-performance caching and session storage for real-time game data.

### Data Structures

#### Game State Storage
```typescript
interface LiveGameData {
  shortcode: string;
  game_data: string;        // Compressed game state
  metadata: GameMetadata;   // Game configuration
  players: PlayerIdentity[];
  spectators: PlayerIdentity[];
  created: Date;
  last_activity: Date;
}
```

#### User Session Storage
```typescript
interface UserSession {
  userId: UUID;
  username: string;
  email: string;
  isVerified: boolean;
  lastActivity: Date;
  permissions: string[];
}
```

#### Matchmaking Queues
```typescript
interface QueueEntry {
  playerId: string;
  gameMode: string;
  timeControl: TimeControl;
  rating: number;
  joinedAt: Date;
  preferences: MatchmakingPreferences;
}
```

### Key Operations (`redis/ops.ts`)

#### `setLiveGame(shortcode: string, gameData: LiveGameData)`
- **Purpose**: Store active game state for real-time access
- **TTL**: Configurable expiration (default 24 hours)
- **Compression**: Game state compressed for storage efficiency

#### `getLiveGame(shortcode: string)`
- **Purpose**: Retrieve live game data with decompression
- **Caching**: Frequently accessed games cached in memory
- **Fallback**: Falls back to DynamoDB if Redis data expired

#### `updateGameState(shortcode: string, newState: string)`
- **Purpose**: Update game state atomically
- **Concurrency**: Uses Redis transactions for thread safety
- **Broadcasting**: Triggers real-time updates to connected clients

#### `addToMatchmakingQueue(queueName: string, entry: QueueEntry)`
- **Purpose**: Add player to matchmaking queue
- **Priority**: Supports priority queues for VIP users
- **Expiration**: Auto-removes stale queue entries

### Performance Features
- **Connection Pooling**: Reuse connections across requests
- **Pipeline Operations**: Batch multiple Redis commands
- **Lua Scripts**: Atomic operations for complex logic
- **Memory Optimization**: Efficient data structures and compression

## DynamoDB Layer (`dynamodb/`)

### Purpose
Scalable NoSQL storage for game history, analytics, and high-volume data.

### Table Structure (`dynamoTables.ts`)

#### Games Table
```typescript
interface GameRecord {
  PK: string;              // "GAME#shortcode"
  SK: string;              // "METADATA" or "MOVE#timestamp"
  GSI1PK: string;          // "USER#userId" for user games
  GSI1SK: string;          // Game end timestamp for sorting
  
  // Game metadata
  shortcode: string;
  players: PlayerData[];
  gameMode: string;
  timeControl: TimeControl;
  result: GameResult;
  created: Date;
  completed?: Date;
  
  // Move data (for SK starting with "MOVE#")
  moveNumber?: number;
  column?: number;
  player?: string;
  timestamp?: Date;
  boardState?: string;
}
```

#### Analytics Table
```typescript
interface AnalyticsRecord {
  PK: string;              // "ANALYTICS#type"
  SK: string;              // Timestamp or identifier
  
  eventType: string;       // "game_completed", "user_registered", etc.
  userId?: UUID;
  gameId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}
```

### Key Operations (`dynamodb/ops.ts`)

#### `saveGameHistory(gameData: CompleteGameData)`
- **Purpose**: Archive completed game with full move history
- **Structure**: Single game record with move items
- **Indexing**: GSI for user game queries, timestamp sorting

#### `getUserGameHistory(userId: UUID, limit?: number, lastKey?: string)`
- **Purpose**: Retrieve user's game history with pagination
- **Performance**: Uses GSI for efficient user-based queries
- **Pagination**: Supports cursor-based pagination

#### `getGameAnalytics(timeRange: DateRange, eventTypes?: string[])`
- **Purpose**: Query game analytics and statistics
- **Aggregation**: Supports time-based aggregations
- **Filtering**: Filter by event types and user segments

#### `saveUserStats(userId: UUID, stats: UserStatistics)`
- **Purpose**: Store user performance statistics
- **Aggregation**: Pre-calculated statistics for fast retrieval
- **History**: Maintains historical statistics snapshots

### Optimization Features
- **Single Table Design**: Efficient data modeling with GSIs
- **Batch Operations**: Batch writes for improved performance
- **Conditional Writes**: Prevent data race conditions
- **Auto Scaling**: Dynamic capacity adjustment based on load

## RDS Layer (`rds/`)

### Purpose
ACID-compliant relational storage for user accounts, events, and structured data.

### Repository Pattern (`rds/repositories/`)

#### User Operations (`userOps.ts`)
```typescript
interface UserRepository {
  createUser(userData: CreateUserData): Promise<User>;
  findUserById(id: UUID): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  updateUser(id: UUID, updates: Partial<User>): Promise<User>;
  deleteUser(id: UUID): Promise<boolean>;
  updateUserRating(id: UUID, newRating: number): Promise<void>;
  getUserStatistics(id: UUID): Promise<UserStatistics>;
}
```

#### Event Operations (`eventsOps.ts`)
```typescript
interface EventRepository {
  createEvent(eventData: CreateEventData): Promise<Event>;
  getActiveEvents(): Promise<Event[]>;
  getUserEvents(userId: UUID): Promise<Event[]>;
  registerForEvent(eventId: UUID, userId: UUID): Promise<void>;
  updateEventStandings(eventId: UUID, standings: EventStanding[]): Promise<void>;
  getEventLeaderboard(eventId: UUID): Promise<EventStanding[]>;
}
```

#### Admin Operations (`adminOps.ts`)
```typescript
interface AdminRepository {
  getUserList(filters: UserFilters, pagination: Pagination): Promise<PaginatedUsers>;
  banUser(userId: UUID, reason: string, duration?: Date): Promise<void>;
  unbanUser(userId: UUID): Promise<void>;
  getSystemStatistics(): Promise<SystemStats>;
  getAuditLog(filters: AuditLogFilters): Promise<AuditLogEntry[]>;
}
```

### Transaction Management (`utils/withTransaction.ts`)

#### Transaction Wrapper
```typescript
async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Connection Management (`utils/withDbClient.ts`)

#### Connection Pool
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000, // Connection timeout
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

## Data Models (`models/`)

### Game Model (`Game.ts`)
```typescript
export class Game {
  shortcode: string;
  players: PlayerData[];
  gameMode: GameMode;
  timeControl: TimeControl;
  boardState: number[][];
  currentPlayer: number;
  moveHistory: Move[];
  result?: GameResult;
  created: Date;
  completed?: Date;

  constructor(gameData: GameCreationData) {
    // Initialize game state
  }

  makeMove(column: number, player: number): MoveResult {
    // Validate and apply move
  }

  checkWinCondition(): GameResult | null {
    // Check for wins, draws, timeouts
  }

  serialize(): string {
    // Compress game state for storage
  }

  static deserialize(data: string): Game {
    // Restore game state from storage
  }
}
```

### User Model (`User.ts`)
```typescript
export class User {
  id: UUID;
  username: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  isActive: boolean;
  profilePictureUrl?: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  created: Date;
  lastLogin?: Date;
  preferences: UserPreferences;

  constructor(userData: UserData) {
    // Initialize user instance
  }

  validatePassword(password: string): Promise<boolean> {
    // Verify password against hash
  }

  updateRating(change: EloChange): void {
    // Apply rating change with bounds checking
  }

  getWinRate(): number {
    // Calculate win percentage
  }

  toPublicProfile(): PublicUserProfile {
    // Return public-safe user data
  }
}
```

## Database Operations Patterns

### CRUD Operations
- **Create**: Insert new records with validation
- **Read**: Query with filtering, sorting, and pagination
- **Update**: Atomic updates with optimistic locking
- **Delete**: Soft deletes with audit trails

### Performance Optimizations
- **Indexing**: Strategic index creation for query patterns
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Efficient SQL and NoSQL queries
- **Caching**: Multi-layer caching strategy

### Data Consistency
- **ACID Transactions**: Maintain data integrity
- **Eventual Consistency**: Handle distributed data scenarios
- **Conflict Resolution**: Handle concurrent updates
- **Data Validation**: Comprehensive input validation

### Security Features
- **SQL Injection Prevention**: Parameterized queries
- **Data Encryption**: Encrypt sensitive data at rest
- **Access Control**: Database-level permissions
- **Audit Logging**: Track all data modifications

---

*This documentation covers the database layer architecture and operations. For service-level business logic, see the Services documentation.*