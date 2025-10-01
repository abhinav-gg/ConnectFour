import { Socket } from 'socket.io';
import { withNamespace } from '../handlers';
import { redisOps } from '@/redis/ops';
import { gameService } from '@/services/game.service';
import { getIdentity, isBotIdentity } from '@/utils/validation';
import { getIdentityFromSocket } from '@/lib/middleware/game.middleware';
import { RoomSchema } from '../socketRoomSchema';
import { liveGameService } from '@/services/livegame.service';
import { GameContext } from '@/utils/gameContext';
import { GameInfo, TimeControl } from '@shared/types/game.types';
import { GameState } from '@shared/constants/allgamestates';

async function handleDisconnectSocket(socket: Socket) {
  try {
    const userId = getIdentityFromSocket(socket);
    if (!userId) {
        console.warn('User identity not found on disconnect');
        return;
    }

    console.log(`[Socket] User ${userId} disconnected from socket ${socket.id}`);
    // Create fresh GameContext at socket level
    const gameContext = new GameContext(userId);
    const metadata = await gameContext.getMetadata();
    if (metadata && metadata.shortcode) {
      socket.leave(RoomSchema.game.key(metadata.shortcode));
      socket.leave(RoomSchema.spectating.key(metadata.shortcode));
    }
    
    await liveGameService.handleDisconnect(gameContext);
      

  } catch (error) {
      console.error('Error handling disconnect:', error);
  }
}

// Register matchmaking handlers
export function registerMatchmakingHandlers(soc: Socket) {

  const socket = withNamespace(soc, 'matchmaking');

  // Handle disconnect and leave events using the same handler
  const disconnectHandler = async () => {
      await handleDisconnectSocket(socket);
  };

  soc.on('disconnect', disconnectHandler);
  socket.on('leave', disconnectHandler);

  socket.on('join', async (data) => {
    try {
      console.log('User joined matchmaking:', data);
      const identity = getIdentityFromSocket(socket);
      if (!identity) {
        throw new Error('User identity is required to join matchmaking');
      }
      
      const shortCode = data.shortcode;
      if (!shortCode) {
        throw new Error('Short code is required to join matchmaking');
      }

      // Create fresh GameContext at socket level
      const gameContext = await GameContext.fromShortcode(identity, shortCode);
      const response = await gameService.tryJoinGame(gameContext);
      
      console.log('Matchmaking response:', response);
      if (response.status === 404) {
        socket.emit('failed');
        return;
      }

      socket.join(RoomSchema.game.key(shortCode));
      await liveGameService.dropDisconnectJob(gameContext);
      let isSpectating = false;

      if (response.status == 101) {
        // Spectating logic
        socket.join(RoomSchema.spectating.key(shortCode));
        isSpectating = true;

      }
      const metadata = await gameContext.getMetadata();
      if (!metadata) {
        soc.emit('error', { message: 'Game metadata not found' });
      }
      // Check if this is a bot game
      const isP2Bot = metadata && metadata.players.some(playerId => playerId && isBotIdentity(playerId));

      socket.emit('joined', { shortcode: shortCode, 
        gameinfo: {
          gamemode: metadata!.gamemode,
          time_control: {
            base_time: metadata!.base_time,
            increment: metadata!.increment,
            disadvantage: metadata!.disadvantage,
          } as TimeControl
        } as GameInfo,
        isSpectating,
        isP2Bot: isP2Bot || false
      });

      // After player joins, check if this is a bot game and trigger bot move if needed
      if (!isSpectating && metadata && metadata.state === GameState.IN_PROGRESS) {
        // Check if any player is a bot and if it's their turn
        const timedata = await gameContext.getTimedata();
        if (timedata && metadata.players.length === 2) {
          const currentPlayerIndex = timedata.cTurn;
          const currentPlayerId = metadata.players[currentPlayerIndex];
          
          if (currentPlayerId && isBotIdentity(currentPlayerId)) {
            console.log("Bot's turn detected on player join, triggering bot move");
            // Trigger bot move with a small delay to ensure socket connection is stable
            setTimeout(async () => {
              try {
                await liveGameService.ManageBotMove(gameContext.gameId!);
              } catch (error) {
                console.error("Error triggering bot move on join:", error);
              }
            }, 500);
          }
        }
      }

    } catch (error) {
      console.error('Error joining matchmaking:', error);
      socket.emit('error', { message: 'Failed to join matchmaking' });
    }
  });


  socket.on('cancel', async () => {
    try {
      console.log('User canceled matchmaking');
      
      const identity = getIdentityFromSocket(socket);
      if (!identity) {
        throw new Error('User identity is required to cancel matchmaking');
      }

      const gameContext = new GameContext(identity);
      await gameService.QuitPlayerQueue(gameContext);

    } catch (error) {
      console.error('Error leaving matchmaking:', error);
    }
  });
}
