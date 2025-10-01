# ConnectFour Backend Documentation

## Overview

The ConnectFour backend is a comprehensive Node.js/TypeScript application that provides real-time multiplayer Connect 4 gameplay with advanced features including bot opponents, user authentication, game analysis, and tournament support.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │   API Server    │    │  Socket Server   │              │
│  │   (Express)     │    │   (Socket.IO)    │              │
│  │                 │    │                  │              │
│  │ • REST Routes   │    │ • Real-time      │              │
│  │ • Auth          │    │ • Game Events    │              │
│  │ • Middleware    │    │ • Matchmaking    │              │
│  └─────────────────┘    └──────────────────┘              │
│          │                       │                        │
│          └───────────┬───────────┘                        │
│                      │                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Services Layer                       │  │
│  │                                                     │  │
│  │ • Auth Service    • Game Service                   │  │
│  │ • User Service    • LiveGame Service               │  │
│  │ • Bot System      • Email Service                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                      │                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Data Layer                           │  │
│  │                                                     │  │
│  │ • Redis (Game State, Sessions, Queues)            │  │
│  │ • DynamoDB (Game History, Analytics)               │  │
│  │ • RDS (User Data, Events, Admin)                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                      │                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Background Jobs & Tools                  │  │
│  │                                                     │  │
│  │ • Email Queue     • Game Analysis                  │  │
│  │ • Timeout Jobs    • Opening Book                   │  │
│  │ • Validation      • Bot Implementations            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Server Infrastructure
- **API Server** (`api-server.ts`): Express.js REST API server
- **Socket Server** (`socket-server.ts`): Socket.IO real-time communication server
- **Bootstrap** (`bootstrap.ts`): Application initialization and setup

### Controllers
- **API Controllers**: REST endpoint handlers
  - Authentication routes
  - Game management routes
  - Event and tournament routes
  - Payment processing routes
- **Socket Controllers**: Real-time event handlers
  - Game events and moves
  - Matchmaking system
  - Waiting room management

### Services
- **Auth Service**: User authentication and session management
- **Game Service**: Game creation, validation, and management
- **LiveGame Service**: Real-time game state management
- **User Service**: User profile and statistics management

### Data Layer
- **Redis**: High-performance caching and session storage
- **DynamoDB**: NoSQL database for game history and analytics
- **RDS**: Relational database for user data and events

### Bot System
- **8 AI Opponents**: From beginner to perfect play level
- **Strategy Implementations**: Unique algorithms for each difficulty
- **Real-time Integration**: Seamless bot move processing

### Background Jobs
- **Email Processing**: Verification and notification emails
- **Game Timeouts**: Automatic game timeout handling
- **Data Validation**: Profile picture validation and cleanup

## Key Features

### Real-time Multiplayer
- WebSocket-based real-time gameplay
- Spectator mode support
- Live game state synchronization
- Connection handling and recovery

### Authentication System
- JWT-based session management
- Email verification workflow
- Anonymous play support
- Rate limiting and security

### Game Engine
- Complete Connect 4 rule implementation
- Move validation and game state tracking
- Win condition detection
- Draw handling and timeout management

### Bot Integration
- 8 difficulty levels from random to perfect play
- Real-time bot move calculation
- Seamless human vs AI gameplay
- Strategy-based implementations

### Performance & Scalability
- Redis caching for fast game state access
- Connection pooling for database operations
- Background job processing
- Efficient data structures and algorithms

## Technology Stack

### Core Technologies
- **Node.js**: JavaScript runtime
- **TypeScript**: Type-safe development
- **Express.js**: Web framework
- **Socket.IO**: Real-time communication

### Databases
- **Redis**: Session storage and game state caching
- **DynamoDB**: Game history and analytics
- **PostgreSQL (RDS)**: User data and events

### Infrastructure
- **BullMQ**: Background job processing
- **JWT**: Authentication tokens
- **Nodemailer**: Email services
- **AWS SDK**: Cloud services integration

## Development Workflow

### Environment Setup
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development servers
npm run dev  # API + Socket servers
```

### Code Organization
- **TypeScript**: Full type safety across the codebase
- **Modular Architecture**: Clean separation of concerns
- **Shared Types**: Common interfaces with frontend
- **Error Handling**: Comprehensive error management

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component validation
- **Load Testing**: Performance under stress
- **Security Testing**: Authentication and authorization

## API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/verify` - Email verification
- `POST /auth/logout` - User logout

### Game Endpoints
- `POST /games/request` - Create game request
- `GET /games/:id` - Get game details
- `POST /games/:id/move` - Make game move
- `GET /games/:id/history` - Get game history

### User Endpoints
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/stats` - Get user statistics
- `GET /user/games` - Get user game history

## Socket Events

### Game Events
- `move` - Player makes a move
- `game_update` - Game state update
- `player_joined` - Player joins game
- `player_left` - Player leaves game
- `game_ended` - Game completion

### Matchmaking Events
- `join_queue` - Join matchmaking queue
- `leave_queue` - Leave matchmaking queue
- `match_found` - Match has been found
- `joined` - Successfully joined game room

## Configuration

### Environment Variables
- `NODE_ENV` - Development/production environment
- `PORT` - Server port (default: 3001)
- `REDIS_URL` - Redis connection string
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_*` - AWS credentials and configuration
- `JWT_SECRET` - JWT signing secret
- `EMAIL_*` - Email service configuration

### Database Configuration
- **Redis**: Session storage, game state, queues
- **DynamoDB**: Game history, analytics, leaderboards
- **PostgreSQL**: User profiles, events, admin data

## Deployment

### Production Setup
- **Environment**: AWS/Cloud infrastructure
- **Scaling**: Horizontal scaling with load balancers
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated database backups

### CI/CD Pipeline
- **Testing**: Automated test suite execution
- **Building**: TypeScript compilation and optimization
- **Deployment**: Zero-downtime deployment strategies
- **Rollback**: Quick rollback capabilities

---

*This documentation provides a high-level overview of the ConnectFour backend system. For detailed component documentation, see the individual documentation files for each module.*