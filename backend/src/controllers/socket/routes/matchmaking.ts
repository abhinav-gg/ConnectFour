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
      socket.emit('joined', { message: 'Looking for opponents...', shortcode: shortCode });

      if (response.status == 100) {
        // Create a new GameContext for the returned gameId
        const startGameContext = await GameContext.fromGameId(identity, response.message);
        await gameService.StartStandardGame(startGameContext);
      }
      

    } catch (error) {
      console.error('Error joining matchmaking:', error);
      socket.emit('error', { message: 'Failed to join matchmaking' });
    }
  });
  
  
  
  socket.on('spectate', async (data) => {
    try {
      console.log('User joined spectate:', data);
            
      const shortCode = data.shortcode;
      if (!shortCode) {
        throw new Error('Short code is required to join matchmaking');
      }

      
      
      socket.join(RoomSchema.game.key(shortCode));
      socket.emit('joined', { message: 'Looking for opponents...', shortcode: shortCode });
      

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



// // bellow needs to be re-written with Redis


// export async function FindCompetitiveMatch(userId: string, time_control: TimeControl, gamemode: GameMode, priority: number): Promise<string | null> {

//     // Can safely assume the player is not in a game (checked before call)
//     try {
//         // Add player to matchmaking queue
//         const gamemodeId = await dbOperations.GetGameModeID(gamemode);
//         const timeControlId = await dbOperations.GetExactTimeControl(time_control);
//         const game_info = await dbOperations.GetGameInfoID(gamemodeId, timeControlId);
//         const playerElo = await safeGetElo(userId, gamemodeId);
        
//         await dbOperations.BeginFindingGame(userId, game_info);

//         const potentialMatch = await dbOperations.QueryMatckmaking(userId, game_info);
//         console.log('Potential Matches:', potentialMatch, priority);
        
//         // If we found a match
//         if (potentialMatch) {

//             // Check time current player has been in queue

//             // ADJUST AS NEEDED:
//             // If they have been waiting >10 seconds, create the game
//             // If opponent elo diff is <30, create the game
//             if (priority >= 10 || Math.abs(playerElo.elo - potentialMatch.elo) <= 30) {
//                 // Calculate expected scores based on ratings
//                 const game = await createGame(gamemode, time_control);

//                 // TODO: add a switch case on the gamemode to assign the player numbers

//                 const thisPNum = Math.random() > 0.5 ? 0 : 1;
//                 await assignGame(game.id, userId, thisPNum);
//                 await assignGame(game.id, potentialMatch.user_id, Math.abs(thisPNum - 1));
//                 try {
//                     eventEmitter.pub("SendToRoom", { 
//                         userId: potentialMatch.user_id, 
//                         roomId: game.short_id 
//                     });
//                 } catch (error) {
//                     console.error('Failed to send user to room:', error);
//                 }
//                 return game.short_id;
//             }
//             else {
//                 console.log("Not good enough match, waiting for better match");
//             }
//         } 
//         // Nobody is playing the same game mode, wait for a match
//         return null;

//     } catch (error) {
//         console.error('Error in FindCompetitiveMatch:', error);
//         // Clean up the game lookup entry if there was an error
//         throw error;
//     }
// }


