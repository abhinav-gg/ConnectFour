# Backend Services Documentation

## Overview

The services layer contains the core business logic for the ConnectFour application. These services are used by both API and Socket controllers to handle authentication, game management, user operations, and real-time gameplay.

## Architecture

```
services/
├── auth.service.ts      # Authentication and session management
├── game.service.ts      # Game creation and management  
├── livegame.service.ts  # Real-time game state management
└── user.service.ts      # User profile and statistics
```

## Authentication Service (`auth.service.ts`)

### Purpose
Handles user authentication, registration, session management, and security operations.

### Key Functions

#### `registerUser(userData: UserRegistrationData)`
- **Purpose**: Create new user account with email verification
- **Process**:
  1. Validates input data (username, email, password)
  2. Checks username and email uniqueness
  3. Hashes password using bcrypt with salt rounds
  4. Creates user record in RDS database
  5. Generates email verification code
  6. Sends verification email via email service
  7. Returns registration result
- **Security**: Password hashing, input sanitization, rate limiting

#### `authenticateUser(credentials: LoginCredentials)`
- **Purpose**: Verify user credentials and create session
- **Process**:
  1. Validates reCAPTCHA token
  2. Retrieves user by username/email
  3. Verifies password against stored hash
  4. Checks account status (verified, suspended)
  5. Generates JWT session token
  6. Updates last login timestamp
  7. Returns user profile and token
- **Security**: Timing attack prevention, account lockout, audit logging

#### `verifyEmail(userId: UUID, code: string)`
- **Purpose**: Verify user email address with code
- **Process**:
  1. Retrieves verification code from database
  2. Validates code and expiration time
  3. Updates user verification status
  4. Removes used verification code
  5. Sends welcome email
- **Security**: Code expiration, single-use codes, rate limiting

#### `refreshSession(token: string)`
- **Purpose**: Refresh expired JWT tokens
- **Process**:
  1. Validates existing token structure
  2. Checks token expiration and blacklist
  3. Verifies user account status
  4. Generates new token with extended expiry
  5. Blacklists old token (optional)
- **Security**: Token rotation, blacklist management

#### `resetPassword(email: string, newPassword: string, resetToken: string)`
- **Purpose**: Handle password reset process
- **Process**:
  1. Validates reset token and expiration
  2. Verifies token belongs to email
  3. Hashes new password
  4. Updates user password
  5. Invalidates all existing sessions
  6. Sends confirmation email
- **Security**: Secure token generation, session invalidation

### Session Management
- **JWT Tokens**: Stateless authentication with secure claims
- **Token Blacklisting**: Invalidate compromised tokens
- **Session Expiry**: Configurable token lifetimes
- **Refresh Tokens**: Long-lived refresh capability

### Security Features
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Prevent brute force attacks
- **Account Lockout**: Temporary lockout after failed attempts
- **Audit Logging**: Track authentication events
- **Two-Factor Support**: TOTP integration (future feature)

## Game Service (`game.service.ts`)

### Purpose
Manages game creation, validation, matchmaking, and game lifecycle operations.

### Key Functions

#### `createGame(gameInfo: GameInfo, players: PlayerIdentity[])`
- **Purpose**: Create new game instance with players
- **Process**:
  1. Validates game parameters and player eligibility
  2. Generates unique game shortcode
  3. Initializes game state and metadata
  4. Creates Redis game record
  5. Sets up player data and roles
  6. Initializes timers and clocks
  7. Returns game creation result
- **Validation**: Player ratings, game mode restrictions, concurrent games

#### **[BOT LOGIC]** `createBotGame(gameContext: GameContext, botGameInfo: BotGameInfo)`
- **Purpose**: Create game with AI opponent using zero time control
- **Process**:
  1. Validates bot ID and game mode (STANDARD_BOT_MATCH or STANDARD_ARMAGEDDON_BOT_MATCH)
  2. **Forces time control to 0|0|0** regardless of input (no timers in bot games)
  3. Creates bot player identity using makeBotIdentity()
  4. Determines player colors (red/yellow/random)
  5. Sets up game metadata with human and bot players
  6. Assigns human player to game queue
- **Bot Behavior**: All bot games use zero time control, no timer functionality

#### **[BOT LOGIC]** `tryJoinGame(gameContext: GameContext)`
- **Purpose**: Join existing game with bot game rejection
- **Process**:
  1. Gets fresh game metadata
  2. **Bot Game Check**: Returns 404 "Bot game is no longer available" for bot games
  3. For regular games: Validates player can join
  4. Handles reconnection or new player assignment
  5. Starts game if conditions are met
- **Bot Behavior**: Completely blocks joining any bot games (they end on disconnect)

#### **[BOT LOGIC]** `ReconnectPlayer(gameContext: GameContext, meOnly: boolean)`
- **Purpose**: Reconnect player to game with bot game prevention
- **Process**:
  1. Gets fresh game data and player information
  2. **Bot Game Prevention**: Throws error for bot games (no reconnection allowed)
  3. For regular games: Sends game setup data to reconnecting player
  4. Handles ELO changes for competitive games
  5. Emits setup events to appropriate players
- **Bot Behavior**: Bot games cannot use reconnection functionality

#### `validateMove(shortcode: string, column: number, playerIdentity: PlayerIdentity)`
- **Purpose**: Validate move legality before processing
- **Validation**:
  1. Checks game state and turn order
  2. Validates player authorization
  3. Verifies column availability
  4. Checks game rules and constraints
  5. Returns validation result
- **Rules Engine**: Complete Connect 4 rule implementation

#### `endGame(shortcode: string, result: GameResult)`
- **Purpose**: Complete game and process results
- **Process**:
  1. Finalizes game state and result
  2. Calculates rating changes (ELO system)
  3. Updates player statistics
  4. Archives game to DynamoDB
  5. Cleans up Redis data
  6. Distributes rewards/penalties
- **Statistics**: Comprehensive game analytics and player tracking

### Matchmaking System
- **Queue Management**: Multiple queue types by rating and mode
- **Rating Matching**: ELO-based opponent pairing
- **Wait Time Optimization**: Dynamic search expansion
- **Priority Matching**: Premium users, tournament participants

### Game Modes
- **Standard**: Classic Connect 4 with standard timing
- **Blitz**: Fast-paced games with shorter time controls
- **Bullet**: Ultra-fast games for quick matches
- **Custom**: User-defined rules and timing
- **Tournament**: Special tournament mode with restrictions

## LiveGame Service (`livegame.service.ts`)

### Purpose
Handles real-time game state management, move processing, and live game events.

### Key Functions

#### `processMove(shortcode: string, column: number, playerIdentity: PlayerIdentity)`
- **Purpose**: Process and validate player moves in real-time
- **Process**:
  1. Validates move authorization and legality
  2. Updates game board state
  3. Checks for win/draw conditions
  4. Updates player clocks and timers
  5. Triggers next player's turn
  6. Broadcasts state updates via socket
  7. Handles game completion if applicable
- **Concurrency**: Thread-safe state updates, race condition handling

#### `manageBotMove(shortcode: string, botId: string)`
- **Purpose**: Process AI bot moves automatically
- **Process**:
  1. Retrieves current game state
  2. Loads appropriate bot implementation
  3. Calculates bot move using AI algorithm
  4. Validates and applies bot move
  5. Updates game state and notifies players
  6. Handles errors and fallback strategies
- **AI Integration**: Seamless bot move processing

#### `handleTimeout(shortcode: string, playerIdentity: PlayerIdentity)`
- **Purpose**: Process player timeouts and clock management
- **Process**:
  1. Validates timeout conditions
  2. Applies time penalties or game loss
  3. Updates game result based on timeout type
  4. Notifies players of timeout result
  5. Processes game completion
- **Timing**: Precise clock management, timeout detection

#### `addSpectator(shortcode: string, spectatorIdentity: PlayerIdentity)`
- **Purpose**: Add spectator to ongoing game
- **Process**:
  1. Validates spectator permissions
  2. Adds to spectator list
  3. Sends current game state
  4. Sets up real-time updates
  5. Updates spectator count
- **Spectator Features**: Live viewing, spectator chat, statistics

#### `processChat(shortcode: string, message: ChatMessage, sender: PlayerIdentity)`
- **Purpose**: Handle in-game chat messages
- **Process**:
  1. Validates message content and sender
  2. Applies profanity filtering
  3. Checks rate limiting per user
  4. Broadcasts to appropriate audience
  5. Logs for moderation purposes
- **Moderation**: Content filtering, rate limiting, admin tools

#### **[BOT LOGIC]** `handleDisconnect(gameContext: GameContext)`
- **Purpose**: Handle player disconnections with special bot game logic
- **Process**:
  1. Validates player is in game room
  2. **Bot Game Check**: If bot game mode, immediately force resignation
  3. For regular games: Creates 30-second reconnection timer
  4. Emits disconnect signal to other players
  5. Schedules disconnection job for timeout handling
- **Bot Behavior**: Bot games end immediately on disconnect, no reconnection allowed

#### **[BOT LOGIC]** `dropDisconnectJob(gameContext: GameContext)`
- **Purpose**: Cancel disconnection job when player reconnects
- **Process**:
  1. Validates player in game room
  2. **Bot Game Rejection**: Throws error for bot games (no reconnection)
  3. For regular games: Cancels pending disconnection job
  4. Emits reconnect signal to other players
  5. Restores normal game flow
- **Bot Behavior**: Bot games cannot use this function

### Real-time Features
- **Live State Updates**: Instant game state synchronization
- **Move Animations**: Coordinate piece drop animations
- **Clock Synchronization**: Real-time timer updates
- **Spectator Support**: Live spectating with full feature set

### Performance Optimizations
- **Redis Caching**: Fast game state access and updates
- **Event Batching**: Efficient real-time update broadcasting
- **Connection Pooling**: Optimized database connections
- **Memory Management**: Efficient game state storage

## User Service (`user.service.ts`)

### Purpose
Manages user profiles, statistics, achievements, and social features.

### Key Functions

#### `getUserProfile(userId: UUID)`
- **Purpose**: Retrieve complete user profile information
- **Returns**:
  - Basic profile (username, email, avatar)
  - Game statistics (wins, losses, rating)
  - Achievement progress
  - Preferences and settings
- **Privacy**: Respect user privacy settings

#### `updateUserProfile(userId: UUID, updates: ProfileUpdate)`
- **Purpose**: Update user profile information
- **Process**:
  1. Validates update permissions and data
  2. Applies profile picture validation
  3. Updates database records
  4. Invalidates cached profile data
  5. Logs profile changes
- **Validation**: Input sanitization, image validation, username uniqueness

#### `getUserStatistics(userId: UUID, period?: TimePeriod)`
- **Purpose**: Calculate and return user game statistics
- **Statistics**:
  - Win/loss ratio and streaks
  - Rating history and progression
  - Game mode performance
  - Time-based analytics
- **Analytics**: Comprehensive performance tracking

#### `updateUserRating(userId: UUID, ratingChange: EloChange)`
- **Purpose**: Update user rating after game completion
- **Process**:
  1. Calculates new rating using ELO algorithm
  2. Updates rating history
  3. Checks for rating milestones
  4. Triggers achievement unlocks
  5. Updates leaderboard rankings
- **ELO System**: Standard chess rating calculations

#### `getUserAchievements(userId: UUID)`
- **Purpose**: Retrieve user achievements and progress
- **Features**:
  - Unlocked achievements
  - Progress toward locked achievements
  - Achievement categories and rarities
  - Social sharing capabilities
- **Gamification**: Engagement through achievement system

### Social Features
- **Friend System**: Add/remove friends, friend requests
- **Leaderboards**: Global and friend leaderboards
- **Profile Sharing**: Public profile views
- **Achievement Sharing**: Social achievement announcements

### Privacy Controls
- **Profile Visibility**: Control public/private profile aspects
- **Game History**: Control game history visibility
- **Friend Requests**: Manage incoming friend requests
- **Block System**: Block unwanted interactions

### Data Management
- **Data Export**: GDPR-compliant data export
- **Account Deletion**: Complete account removal
- **Data Retention**: Configurable data retention policies
- **Audit Trails**: Track profile changes and access

## Service Integration

### Cross-Service Communication
- **Event System**: Services communicate via event emitters
- **Shared Utilities**: Common validation and helper functions
- **Error Handling**: Consistent error types and handling
- **Logging**: Centralized logging with service context

### Database Integration
- **Redis**: Fast caching and session storage
- **RDS**: Persistent user and game data
- **DynamoDB**: Game history and analytics
- **Connection Management**: Pooled connections, error recovery

### External Service Integration
- **Email Service**: Transactional email sending
- **Payment Service**: Stripe integration for premium features
- **Analytics Service**: User behavior and game analytics
- **Monitoring Service**: Performance and error monitoring

---

*This documentation covers the core business logic services. For API endpoints and real-time communication, see the Controllers documentation.*