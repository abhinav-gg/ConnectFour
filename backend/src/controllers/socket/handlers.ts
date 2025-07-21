import { Socket } from 'socket.io';

// Main connection handler
export const registerSocketHandler = {
  game: registerGameHandlers,
  matchmaking: registerMatchmakingHandlers,
  reg: registerWaitingRoomHandlers,
}

// Disconnect handler
function handleDisconnect(socket: Socket) {
  // Clean up user state, remove from rooms, etc.
  console.log(`Cleaning up user ${socket.id}`);
  
  // Leave all rooms
  socket.rooms.forEach(room => {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`User ${socket.id} left room ${room}`);
    }
  });
}

// Register game-related handlers
function registerGameHandlers(socket: Socket) {
  // Game move handling
  socket.on('game_move', async (data) => {
    try {
      console.log('Game move received:', data);
      // Broadcast the move to other players in the same room
      socket.broadcast.emit('game_move', data);
    } catch (error) {
      console.error('Error handling game move:', error);
      socket.emit('error', { message: 'Failed to process game move' });
    }
  });

  // Join game room
  socket.on('join_game', async (gameId) => {
    try {
      socket.join(gameId);
      console.log(`User ${socket.id} joined game ${gameId}`);
      socket.emit('joined_game', { gameId });
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Leave game room
  socket.on('leave_game', async (gameId) => {
    try {
      socket.leave(gameId);
      console.log(`User ${socket.id} left game ${gameId}`);
      socket.emit('left_game', { gameId });
    } catch (error) {
      console.error('Error leaving game:', error);
      socket.emit('error', { message: 'Failed to leave game' });
    }
  });

  // Get game state
  socket.on('get_game_state', async (gameId) => {
    try {
      // TODO: Implement game state retrieval
      socket.emit('game_state', { gameId, state: 'placeholder' });
    } catch (error) {
      console.error('Error getting game state:', error);
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });
}

// Register matchmaking handlers
function registerMatchmakingHandlers(socket: Socket) {
  socket.on('find_match', async (data) => {
    try {
      console.log('User looking for match:', data);
      // TODO: Implement matchmaking logic
      socket.emit('matchmaking_started', { message: 'Looking for opponents...' });
    } catch (error) {
      console.error('Error finding match:', error);
      socket.emit('error', { message: 'Failed to find match' });
    }
  });

  socket.on('cancel_matchmaking', async () => {
    try {
      console.log('User canceled matchmaking');
      // TODO: Implement cancel matchmaking logic
      socket.emit('matchmaking_canceled', { message: 'Matchmaking canceled' });
    } catch (error) {
      console.error('Error canceling matchmaking:', error);
      socket.emit('error', { message: 'Failed to cancel matchmaking' });
    }
  });
}

// Register waiting room handlers
function registerWaitingRoomHandlers(socket: Socket) {
  socket.on('join_waiting_room', async (data) => {
    try {
      console.log('User joining waiting room:', data);
      // TODO: Implement waiting room logic
      socket.emit('waiting_room_joined', { message: 'Joined waiting room' });
    } catch (error) {
      console.error('Error joining waiting room:', error);
      socket.emit('error', { message: 'Failed to join waiting room' });
    }
  });

  socket.on('leave_waiting_room', async () => {
    try {
      console.log('User leaving waiting room');
      // TODO: Implement leave waiting room logic
      socket.emit('waiting_room_left', { message: 'Left waiting room' });
    } catch (error) {
      console.error('Error leaving waiting room:', error);
      socket.emit('error', { message: 'Failed to leave waiting room' });
    }
  });
}
