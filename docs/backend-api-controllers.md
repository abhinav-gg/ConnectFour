# Backend API Controllers Documentation

## Overview

The API controllers handle all REST endpoint requests in the ConnectFour backend. They provide HTTP-based interfaces for user authentication, game management, events, and payment processing.

## Architecture

```
controllers/api/
├── index.ts           # Main API router setup
└── routes/
    ├── authRoutes.ts  # Authentication endpoints
    ├── eventRoutes.ts # Event and tournament endpoints  
    ├── gameRoutes.ts  # Game management endpoints
    └── stripeRoutes.ts # Payment processing endpoints
```

## Authentication Routes (`authRoutes.ts`)

### Purpose
Handles user authentication, registration, email verification, and session management.

### Key Endpoints

#### `POST /auth/register`
- **Purpose**: Register new user account
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string", 
    "password": "string",
    "recaptcha": "string"
  }
  ```
- **Process**:
  1. Validates reCAPTCHA token
  2. Checks username/email availability
  3. Hashes password with bcrypt
  4. Creates user record in database
  5. Generates email verification code
  6. Sends verification email
- **Response**: Success message or error details

#### `POST /auth/login`
- **Purpose**: Authenticate user and create session
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string",
    "recaptcha": "string"
  }
  ```
- **Process**:
  1. Validates reCAPTCHA token
  2. Verifies user credentials
  3. Checks email verification status
  4. Generates JWT session token
  5. Sets secure HTTP-only cookie
- **Response**: User profile data and session token

#### `POST /auth/verify`
- **Purpose**: Verify user email address
- **Authentication**: JWT token required
- **Request Body**:
  ```json
  {
    "code": "string"
  }
  ```
- **Process**:
  1. Validates verification code
  2. Checks code expiration
  3. Updates user verification status
  4. Removes used verification code
- **Response**: Success confirmation

#### `POST /auth/logout`
- **Purpose**: Terminate user session
- **Authentication**: JWT token required
- **Process**:
  1. Validates session token
  2. Clears session cookie
  3. Optionally blacklists token
- **Response**: Logout confirmation

#### `POST /auth/forgot-password`
- **Purpose**: Initiate password reset process
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "email": "string",
    "recaptcha": "string"
  }
  ```
- **Process**:
  1. Validates reCAPTCHA token
  2. Checks if email exists
  3. Generates reset token
  4. Sends password reset email
- **Response**: Success message (regardless of email validity for security)

### Security Features
- **Rate Limiting**: Prevents brute force attacks
- **reCAPTCHA Integration**: Bot protection
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure session management
- **HTTP-Only Cookies**: XSS protection
- **Input Validation**: Comprehensive request validation

### Error Handling
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Invalid credentials
- **403 Forbidden**: Account not verified/suspended
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side errors

## Game Routes (`gameRoutes.ts`)

### Purpose
Handles game creation, management, player matchmaking, and game statistics.

### Key Endpoints

#### `POST /games/request`
- **Purpose**: Create new game or join matchmaking queue
- **Authentication**: User session or anonymous token
- **Request Body**:
  ```json
  {
    "gamemode": "standard|blitz|bullet",
    "timeControl": {
      "base_time": 600,
      "increment": 5,
      "disadvantage": 0
    },
    "botId": "optional-bot-id",
    "playerColor": "red|yellow|random"
  }
  ```
- **Process**:
  1. Validates game parameters
  2. Checks user eligibility
  3. For bot games: Creates immediate match
  4. For human games: Adds to matchmaking queue
  5. Returns game shortcode or queue status
- **Response**: Game creation details or queue position

#### `GET /games/:shortcode`
- **Purpose**: Retrieve game information and current state
- **Authentication**: Optional (affects response details)
- **Parameters**: `shortcode` - Unique game identifier
- **Response**: Game metadata, player info, current state

#### `POST /games/:shortcode/move`
- **Purpose**: Submit a move in an active game
- **Authentication**: Player session required
- **Request Body**:
  ```json
  {
    "column": 0-6
  }
  ```
- **Process**:
  1. Validates player authorization
  2. Checks game state and turn
  3. Validates move legality
  4. Updates game state
  5. Notifies other players via socket
  6. Triggers bot response if applicable
- **Response**: Move confirmation and updated state

#### `GET /games/:shortcode/history`
- **Purpose**: Get complete game move history
- **Authentication**: Player or spectator access required
- **Response**: Chronological list of all moves with timestamps

#### `POST /games/:shortcode/resign`
- **Purpose**: Resign from active game
- **Authentication**: Player session required
- **Process**:
  1. Validates player authorization
  2. Ends game with resignation result
  3. Updates player statistics
  4. Notifies opponent via socket
- **Response**: Resignation confirmation

#### `GET /player`
- **Purpose**: Get current player information and statistics
- **Authentication**: User session required
- **Response**: Player profile, rating, game statistics

### Bot Integration
- **Bot Game Creation**: Seamless bot opponent matching
- **Bot Move Processing**: Automated bot responses
- **Difficulty Selection**: 8 different bot difficulty levels
- **Real-time Integration**: Bot moves processed through same pipeline

### Game State Management
- **Redis Storage**: Fast game state access
- **State Validation**: Comprehensive move validation
- **Concurrency Handling**: Thread-safe state updates
- **Error Recovery**: Robust error handling and recovery

## Event Routes (`eventRoutes.ts`)

### Purpose
Manages tournaments, events, and special game modes.

### Key Endpoints

#### `GET /events`
- **Purpose**: List current and upcoming events
- **Authentication**: Optional (affects response details)
- **Query Parameters**:
  - `status`: active|upcoming|completed
  - `type`: tournament|special|seasonal
- **Response**: Array of event objects with details

#### `POST /events/:eventId/join`
- **Purpose**: Register for tournament or event
- **Authentication**: User session required
- **Process**:
  1. Validates event availability
  2. Checks user eligibility
  3. Processes registration
  4. Updates event participant list
- **Response**: Registration confirmation

#### `GET /events/:eventId/leaderboard`
- **Purpose**: Get event leaderboard and standings
- **Authentication**: Optional
- **Response**: Ranked list of participants with scores

### Event Types
- **Tournaments**: Structured competitive events
- **Special Events**: Limited-time game modes
- **Seasonal Events**: Holiday and themed competitions
- **Community Events**: User-organized competitions

## Stripe Routes (`stripeRoutes.ts`)

### Purpose
Handles payment processing, subscriptions, and premium features.

### Key Endpoints

#### `POST /stripe/create-payment-intent`
- **Purpose**: Create payment intent for premium features
- **Authentication**: User session required
- **Request Body**:
  ```json
  {
    "amount": 999,
    "currency": "usd",
    "type": "premium|tournament_entry"
  }
  ```
- **Process**:
  1. Validates payment parameters
  2. Creates Stripe payment intent
  3. Stores payment record
- **Response**: Client secret for payment completion

#### `POST /stripe/webhook`
- **Purpose**: Handle Stripe webhook events
- **Authentication**: Stripe signature verification
- **Process**:
  1. Verifies webhook signature
  2. Processes payment events
  3. Updates user premium status
  4. Sends confirmation emails

### Payment Features
- **Secure Processing**: PCI-compliant payment handling
- **Subscription Management**: Recurring premium subscriptions
- **Tournament Fees**: Entry fee processing
- **Refund Handling**: Automated refund processing

## Middleware Integration

### Authentication Middleware
- **Session Validation**: JWT token verification
- **User Context**: Attaches user info to requests
- **Anonymous Support**: Handles anonymous players
- **Rate Limiting**: Request throttling

### Game Middleware
- **Game Access Control**: Validates game participation
- **State Synchronization**: Ensures game state consistency
- **Error Handling**: Comprehensive error management
- **Logging**: Request and response logging

### Security Middleware
- **CORS Configuration**: Cross-origin request handling
- **Input Sanitization**: XSS and injection prevention
- **Rate Limiting**: DDoS and abuse prevention
- **Content Security**: Request validation

## Error Handling Strategy

### Error Types
- **Validation Errors**: Input validation failures
- **Authentication Errors**: Session and permission issues
- **Business Logic Errors**: Game rule violations
- **System Errors**: Database and service failures

### Error Response Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "specific field errors"
  },
  "timestamp": "2025-10-01T12:00:00Z"
}
```

### Error Recovery
- **Retry Logic**: Automatic retry for transient failures
- **Fallback Mechanisms**: Alternative processing paths
- **Circuit Breakers**: Prevent cascade failures
- **Monitoring**: Error tracking and alerting

## Performance Optimizations

### Caching Strategy
- **Redis Caching**: Frequently accessed data
- **Query Optimization**: Efficient database queries
- **Response Caching**: HTTP response caching
- **Connection Pooling**: Database connection reuse

### Request Processing
- **Async Processing**: Non-blocking request handling
- **Background Jobs**: Offload heavy processing
- **Resource Limits**: Prevent resource exhaustion
- **Load Balancing**: Distribute request load

---

*This documentation covers the API controllers that handle HTTP requests. For real-time communication, see the Socket Controllers documentation.*