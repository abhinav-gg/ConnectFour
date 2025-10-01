# ConnectFour Bot System Documentation

## Overview

The ConnectFour bot system is a comprehensive AI opponent system that allows users to play against computer-controlled players of varying difficulty levels. The system is designed with a clean architecture that separates concerns between shared constants, backend bot implementations, and frontend UI components.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Bot System Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │   Frontend UI   │    │   Backend API    │              │
│  │                 │    │                  │              │
│  │ • Bot Selection │◄──►│ • Game Creation  │              │
│  │ • Avatar Display│    │ • Bot Validation │              │
│  │ • Color Choice  │    │ • Move Processing │              │
│  └─────────────────┘    └──────────────────┘              │
│           │                       │                        │
│           │              ┌──────────────────┐              │
│           │              │  Socket Layer    │              │
│           │              │                  │              │
│           └──────────────►│ • Real-time Moves│              │
│                          │ • Bot Detection  │              │
│                          │ • Game State     │              │
│                          └──────────────────┘              │
│                                   │                        │
│           ┌─────────────────────────────────────────────┐  │
│           │            Shared Constants                 │  │
│           │                                             │  │
│           │ • Bot Definitions    • Avatar Paths        │  │
│           │ • Difficulty Levels  • UUID Mappings       │  │
│           │ • Utility Functions  • Type Definitions     │  │
│           └─────────────────────────────────────────────┘  │
│                                   │                        │
│           ┌─────────────────────────────────────────────┐  │
│           │         Bot Implementations                 │  │
│           │                                             │  │
│           │ • Strategy Classes   • Move Algorithms      │  │
│           │ • Difficulty Logic   • Error Handling       │  │
│           │ • Bot Registry      • Game Integration      │  │
│           └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Bot Definitions

### Available Bots

The system includes 8 distinct bots with varying difficulty levels and strategies:

| Bot Name | ID | Difficulty | Strategy Description |
|----------|----|-----------|--------------------|
| **RandomBot** | `random-bot` | Beginner | Makes completely random valid moves |
| **AdaptiveBot** | `adaptive-bot` | Beginner+ | Basic pattern recognition with random fallback |
| **BeginnerBot** | `beginner-bot` | Easy | Simple center-preference strategy |
| **IntermediateBot** | `intermediate-bot` | Medium | Balanced offensive/defensive play |
| **ExpertBot** | `expert-bot` | Hard | Advanced strategic analysis |
| **VictorBot** | `victor-bot` | Expert | Aggressive winning-focused strategy |
| **GoatnusBot** | `goatnus-bot` | Master | `f47ac10b-58cc-4372-a567-0e02b2c3d479` |
| **PerfectBot** | `perfect-bot` | Perfect | `550e8400-e29b-41d4-a716-446655440000` |

### Bot Characteristics

#### Beginner Level Bots
- **RandomBot**: Pure random move selection for learning opponents
- **AdaptiveBot**: Slight improvement over random with basic pattern detection

#### Intermediate Level Bots  
- **BeginnerBot**: Prefers center columns, basic blocking
- **IntermediateBot**: Balanced play with moderate lookahead

#### Advanced Level Bots
- **ExpertBot**: Multi-move analysis, threat detection
- **VictorBot**: Aggressive strategies, prioritizes winning combinations

#### Master Level Bots
- **GoatnusBot**: Near-optimal play with deep analysis
- **PerfectBot**: Theoretically perfect play using complete game tree analysis

## File Structure

### Shared Constants
```
shared/constants/botinfo.ts
├── BotType interface definition
├── Bot definitions array (8 bots)
├── getBotAvatar() utility function
└── Bot validation utilities
```

### Backend Implementation
```
backend/src/tools/Bots/
├── index.ts              # Bot registry and utilities
├── BotBase.ts           # Abstract base class
├── RandomBot.ts         # Random move bot
├── AdaptiveBot.ts       # Pattern-recognition bot
├── BeginnerBot.ts       # Center-preference bot
├── IntermediateBot.ts   # Balanced strategy bot
├── ExpertBot.ts         # Advanced analysis bot
├── VictorBot.ts         # Aggressive strategy bot
├── GoatnusBot.ts        # Master-level bot
└── PerfectBot.ts        # Perfect play bot
```

### Frontend Components
```
frontend/src/components/game/utility/bot-play.tsx
├── Bot avatar rendering
├── Image loading with fallback
└── Bot interaction UI
```

## Technical Implementation

### Bot Base Class

All bots extend the abstract `BotBase` class:

```typescript
export abstract class BotBase {
    protected game: TimedStandardGame;
    protected difficulty: string;
    
    constructor(game: TimedStandardGame, difficulty: string) {
        this.game = game;
        this.difficulty = difficulty;
    }
    
    abstract chooseMove(): Promise<number>;
    
    protected getValidMoves(): number[] {
        return this.game.getValidMoves();
    }
    
    protected isWinningMove(column: number): boolean {
        // Implementation details...
    }
    
    protected isBlockingMove(column: number): boolean {
        // Implementation details...
    }
}
```

### Bot Registry System

The bot registry provides centralized access to all bot implementations:

```typescript
// Bot validation
export const isValidBotId = (botId: string): boolean => {
    return validBotIds.has(botId);
};

// Bot retrieval
export const getBotById = (botId: string, game: TimedStandardGame): BotBase => {
    const BotClass = botRegistry.get(botId);
    if (!BotClass) {
        throw new Error(`Bot with ID "${botId}" not found`);
    }
    return new BotClass(game);
};

// Bot listing
export const getAllBots = (): BotType[] => {
    return Bots;  // From shared constants
};
```

## Game Flow

### Bot Game Creation

1. **Frontend Selection**: User selects bot and color on `/game/play-bot` page
2. **API Request**: Frontend calls `/api/games/request` with bot parameters:
   ```json
   {
     "gamemode": "standard",
     "timeControl": { "base_time": 600, "increment": 5 },
     "botId": "expert-bot",
     "playerColor": "red"
   }
   ```
3. **Game Creation**: Backend creates bot game with proper player order
4. **Socket Join**: Player joins game room via WebSocket
5. **Bot Detection**: Backend sets `isP2Bot: true` in joined event metadata

### Bot Move Processing

The `ManageBotMove` function handles bot move execution:

```typescript
export const ManageBotMove = async (shortCode: string, botId: string): Promise<void> => {
    try {
        // Retrieve game state
        const liveGame = await redisOps.getLiveGame(shortCode);
        const Game = TimedStandardGame.fromCompactString(liveGame.game_data);
        
        // Get bot implementation and make move
        const bot = getBotById(botId, Game);
        const botMove = await bot.chooseMove();
        
        // Process move through game service
        await liveGameService.processMove(shortCode, botMove, botPlayerIdentity);
        
    } catch (error) {
        console.error(`Error in ManageBotMove for ${shortCode}:`, error);
        // Error handling...
    }
};
```

### Move Timing

Bot moves are triggered at two key points:

1. **Game Start**: If bot plays red (first), move triggers when human player joins
2. **Response Moves**: After human player makes a move, bot responds immediately

## API Integration

### Bot Game Request Endpoint

The `/api/games/request` endpoint handles bot game creation:

```typescript
// Detect bot game parameters
if (req.body.botId) {
    const { botId, playerColor } = req.body;
    
    // Validate bot ID
    if (!isValidBotId(botId)) {
        return res.status(400).json({ 
            error: 'Invalid bot ID' 
        });
    }
    
    // Create bot game with proper player order
    const result = await gameService.createBotGame(
        playerUUID, 
        gameInfo, 
        botId, 
        playerColor === 'red'
    );
    
    return res.json(result);
}
```

### Socket Layer Integration

The socket layer handles real-time bot interactions:

```typescript
// Bot detection on player join
const isP2Bot = metadata && metadata.players.some(playerId => 
    playerId && isBotIdentity(playerId)
);

socket.emit('joined', { 
    shortcode: shortCode,
    gameinfo: gameInfo,
    isSpectating,
    isP2Bot: isP2Bot || false
});

// Trigger bot move if bot plays first
if (metadata && metadata.players.some(playerId => 
    playerId && isBotIdentity(playerId)
)) {
    await liveGameService.triggerBotMoveIfNeeded(shortCode);
}
```

## Frontend Integration

### Bot Selection UI

The bot selection interface allows users to:

- Choose from 8 available bots
- Select their preferred color (red/yellow)
- View bot avatars and difficulty descriptions
- Start bot games with proper API integration

### Avatar System

Bot avatars use a fallback system:

```typescript
const getBotAvatar = (botId: string): string => {
    const bot = Bots.find(b => b.id === botId);
    return bot?.avatar || '/icons/bot.png';
};

// Frontend usage with error handling
<img 
    src={getBotAvatar(botId)}
    alt={`${botName} avatar`}
    onError={(e) => {
        e.currentTarget.src = '/icons/bot.png';
    }}
/>
```

## Error Handling

The bot system includes comprehensive error handling:

### Bot Validation
- Invalid bot IDs are rejected at API level
- Bot registry prevents access to non-existent bots
- Move validation ensures legal moves only

### Game State Management
- Redis operations include error recovery
- Bot moves are validated before application
- Game state consistency is maintained

### Frontend Resilience
- Avatar loading includes fallback images
- API errors are handled gracefully
- User feedback for failed operations

## Performance Considerations

### Bot Move Efficiency
- Each bot has optimized move calculation algorithms
- Moves are processed asynchronously to prevent blocking
- Game state is cached in Redis for fast access

### Memory Management
- Bot instances are created per-game, then garbage collected
- Game state is stored efficiently in compact format
- Connection pooling for database operations

## Testing Strategy

### Unit Testing
- Individual bot move algorithms
- Game state validation
- API endpoint behavior

### Integration Testing
- Complete bot game flow
- Socket layer interactions
- Frontend-backend integration

### Performance Testing
- Bot move calculation times
- Concurrent bot game handling
- Memory usage under load

## Future Enhancements

### Potential Improvements
1. **Machine Learning Integration**: Train bots on human gameplay data
2. **Custom Bot Creation**: User-defined bot strategies
3. **Tournament Mode**: Bot vs bot competitions
4. **Analytics Dashboard**: Bot performance statistics
5. **Difficulty Scaling**: Dynamic difficulty adjustment based on user skill

### Technical Debt
- Consider WebAssembly for performance-critical bots
- Implement bot move caching for repeated positions
- Add comprehensive logging for bot decision analysis

## Configuration

### Environment Variables
- Bot system uses existing game configuration
- No additional environment variables required
- Inherits Redis and database connection settings

### Deployment Notes
- Bot system is fully integrated with existing infrastructure
- No additional services or dependencies required
- Scales with existing game server architecture

---

*This documentation covers the complete bot system implementation as of October 2025. For updates or questions, refer to the development team.*