# Socket.IO Migration

This project has been migrated from `express-ws` to `socket.io` for better scalability and simplicity.

## Key Changes

### Server Setup
- Replaced `express-ws` with `socket.io`
- Updated server initialization to use HTTP server with Socket.IO
- Improved authentication middleware using Socket.IO's built-in middleware system

### Event Handling
- Replaced WebSocket message parsing with Socket.IO's event-based system
- Simplified event emission and listening
- Better error handling with try-catch blocks

### Client Connection
- Clients now connect to Socket.IO instead of raw WebSocket
- Authentication is handled through Socket.IO middleware
- Events are emitted and listened to directly

## Installation

Add Socket.IO dependencies to your project:

```bash
npm install socket.io @types/socket.io
```

## Server Usage

The server now uses Socket.IO:

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
});

// Setup Socket.IO events
setupGameEvents(io);
setupWaitingRoom(io);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Client Usage

### Basic Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-session-token'
  }
});

// Listen for events
socket.on('gameStart', (data) => {
  console.log('Game started:', data);
});

socket.on('moveMade', (data) => {
  console.log('Move made:', data);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Emit events
socket.emit('joinGame', { roomId: 'game-room-id' });
socket.emit('makeMove', { roomId: 'game-room-id', col: 3 });
```

### Event Types

#### Client to Server Events
- `joinGame` - Join a game room
- `makeMove` - Make a move in the game
- `sendMessage` - Send a chat message
- `playerTimeOut` - Report player timeout
- `opponentAbandoned` - Report opponent abandonment
- `resign` - Resign from the game
- `offerDraw` - Offer a draw
- `acceptDraw` - Accept a draw offer

#### Server to Client Events
- `gameStart` - Game has started
- `playerJoined` - Player joined the room
- `moveMade` - A move was made
- `reconnection` - Player reconnected
- `opponentReconnect` - Opponent reconnected
- `startTimer` - Game timer started
- `endGame` - Game ended
- `playerDisconnected` - Player disconnected
- `receiveMessage` - Received chat message
- `drawOffer` - Draw offer received
- `sendToRoom` - Redirect to different room
- `error` - Error occurred

## Benefits of Socket.IO

1. **Better Scalability**: Built-in support for rooms, namespaces, and clustering
2. **Automatic Reconnection**: Handles disconnections and reconnections automatically
3. **Event-Based**: Cleaner event handling without manual JSON parsing
4. **Middleware Support**: Built-in authentication and middleware system
5. **Cross-Platform**: Works across different platforms and browsers
6. **Better Error Handling**: More robust error handling and debugging
7. **Built-in Features**: Broadcasting, acknowledgments, and more

## Migration Notes

- All WebSocket message parsing has been removed
- Events are now handled directly through Socket.IO's event system
- Authentication is handled through Socket.IO middleware
- Error handling is more consistent across all events
- Room management is simplified with Socket.IO's built-in room system

## Next Steps

1. Update client-side code to use Socket.IO client
2. Test all game events and functionality
3. Consider implementing Socket.IO rooms for better room management
4. Add Socket.IO clustering for production scalability 