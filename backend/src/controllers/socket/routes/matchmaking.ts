import { Socket } from 'socket.io';
import { withNamespace } from '../handlers';
import { redisOps } from '@/redis/ops';
import { gameService } from '@/services/game.service';
import { getIdentity } from '@/utils/validation';
import { getIdentityFromSocket } from '@/lib/game.middleware';
import { RoomSchema } from '../socketRoomSchema';
import { liveGameService } from '@/services/livegame.service';
import { GameContext } from '@/utils/gameContext';

// Register matchmaking handlers
export function registerMatchmakingHandlers(soc: Socket) {

  const socket = withNamespace(soc, 'matchmaking');

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

      if (response.status == 100) {
        socket.emit('joined', {
          message: 'You caused the game to start',
        });
      } else if (response.status == 101) {
        // Spectating logic
        socket.join(RoomSchema.spectating.key(shortCode));
      } else {
        const metadata = await gameContext.getMetadata();
        if (!metadata) {
          soc.emit('error', { message: 'Game metadata not found' });
        }
        socket.emit('joined', { shortcode: shortCode, 
          gameinfo: {
            gamemode: metadata!.gamemode,
            time_control: {
              base_time: metadata!.base_time,
              increment: metadata!.increment,
              disadvantage: metadata!.disadvantage,
            }
          }
        });
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
