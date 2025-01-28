import { GameMode, TimeControl } from '@shared/Models/gameInfo';
import { dbOperations } from '@/db/operations';
import { assignGame, createGame } from './gameHelper';
import { EloChange } from '@shared/Models/gameInfo';
import { StandardStartingElo, StandardStartingRatingDeviation } from '@shared/constants';
import { Glicko } from '@/types/types';
// file to control all elements of user matchmaking and game creation




// TODO: figure out what GameOperations is and why it keeps trying to be used for this function
// FindCompetitiveMatch takes the userID and timeControlId and returns a match or null if they need to wait
export async function FindCompetitiveMatch(userId: string, time_control: TimeControl, gamemode: GameMode): Promise<string | null> {
    
    try {
        // get current time in seconds and calculate time since last played as priority
        
        // Can safely assume the player is not in a game (checked before call)

        // Add player to matchmaking queue
        const gamemodeId = await dbOperations.GetGameModeID(gamemode);
        const timeControlId = await dbOperations.GetExactTimeControl(time_control);
        const game_info = await dbOperations.GetGameInfoID(gamemodeId, timeControlId);
        const playerElo = await dbOperations.GetPlayerStats(userId, gamemodeId);

        await dbOperations.SetPlayerElo(userId, gamemodeId, StandardStartingElo, StandardStartingRatingDeviation);
        
        // Look for potential opponents with same time control and closest rating
        // Orders by absolute difference from ideal rating gap (50)
        const potentialMatch = await dbOperations.QueryMatckmaking(userId, gamemodeId);
        console.log('Potential Matches:', potentialMatch);
        const priority = await dbOperations.GetTimeSinceLastGameLookup(userId);

        await dbOperations.BeginFindingGame(userId, game_info);
        
        // If we found a match
        if (potentialMatch) {

            console.log('Best Opponent:', potentialMatch, 'Priority:', priority);

            // Check time current player has been in queue

            // ADJUST AS NEEDED:
            // If they have been waiting >10 seconds, create the game
            // If opponent elo diff is <30, create the game
            if (priority >= 10 || Math.abs(playerElo.elo - potentialMatch.elo) <= 30) {
                // Calculate expected scores based on ratings
                const game = await createGame(gamemode, time_control);

                // TODO: add a switch case on the gamemode to assign the player numbers

                const thisPNum = Math.random() > 0.5 ? 0 : 1;
                await assignGame(game.id, userId, thisPNum);
                await assignGame(game.id, potentialMatch.user_id, Math.abs(thisPNum - 1));
                return game.short_id;
            }
        }
        // Nobody is playing the same game mode, wait for a match
        return null;

    } catch (error) {
        console.error('Error in FindCompetitiveMatch:', error);
        // Clean up the game lookup entry if there was an error
        throw error;
    }
}


// TODO: GlickoPlayer needs to be stored in the database

export const adjustRD = (player: Glicko): number => {
    const daysSinceLastGame = (player.updated_at) / (1000 * 60 * 60 * 24);
    const newRD = Math.min(350, Math.sqrt(Math.pow(player.rating_deviation, 2) + daysSinceLastGame * 5));
    return newRD;
};

// Calculate new ratings for both players based on Glicko system
export function calculateGlickoRatings(me: Glicko, them: Glicko): EloChange {
    const q = Math.log(10) / 400;  // System constant
    
    // Adjust RD based on time since last played (increases uncertainty)
    

    const p1RD = adjustRD(me);
    const p2RD = adjustRD(them);

    // Calculate g-factor (impact of rating deviation on updates)
    const g1 = 1 / Math.sqrt(1 + 3 * Math.pow(q, 2) * Math.pow(p2RD, 2) / Math.pow(Math.PI, 2));
    const g2 = 1 / Math.sqrt(1 + 3 * Math.pow(q, 2) * Math.pow(p1RD, 2) / Math.pow(Math.PI, 2));

    // Calculate expected scores
    const E1 = 1 / (1 + Math.pow(10, g1 * (them.elo - me.elo) / 400));
    const E2 = 1 / (1 + Math.pow(10, g2 * (me.elo - them.elo) / 400));

    // Calculate rating changes for win/loss
    const d1 = 1 / (Math.pow(q, 2) * Math.pow(g1, 2) * E1 * (1 - E1));
    const d2 = 1 / (Math.pow(q, 2) * Math.pow(g2, 2) * E2 * (1 - E2));

    // Calculate new ratings for all scenarios and round to 2 decimal places
    // For draws, use 0.5 as the score (halfway between 0 and 1)
    const ratingChanges: EloChange = {
        win : Number((me.elo + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (1 - E1)).toFixed(2)),
        loss : Number((me.elo + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (0 - E1)).toFixed(2)),
        draw : Number((me.elo + (q / (1 / Math.pow(p1RD, 2) + 1 / d1)) * g1 * (0.5 - E1)).toFixed(2)),
    };
    return ratingChanges;
}
// import expressWs from "express-ws";
// import { verifyAccessToken } from "@/lib/auth";


// // Create a new websocket server for when the player is waiting for the game to start or for a rematch
// // This will be a separate websocket server to the in-game server
// export const setupWaitingEvents = async (app: expressWs.Application) => {
//     app.ws('/waiting', (ws, req) => {
//       console.log('Client connected to waiting room');
//       const token = req.header('Sec-WebSocket-Protocol') as string;
//       const user = verifyAccessToken(token as string);
//       if (!user) {
//         ws.close();
//         return;
//       }
  
//       // Handle incoming messages
//       ws.on('message', async (message) => {
//         try {
//           console.log('Received message in waiting room:', message);
//           const data = JSON.parse(message.toString());
//           console.log('Parsed message:', data);
  
//           switch (data.event) {
//             case 'joinWaitingRoom': {
//               // Logic for joining the waiting room
//               const userId = user.userId;
//               addSocket(userId, ws);
//               ws.send(JSON.stringify({ event: 'waiting', data: { message: 'You are now in the waiting room.' } }));
//               break;
//             }
  
//             case 'offerRematch': {
//               const { roomId } = data.data;
//               const room = getRoom(roomId);
//               if (!room) {
//                 ws.send(JSON.stringify({ event: 'error', data: { message: 'Room does not exist.' } }));
//                 return;
//               }
  
//               // Notify the other player about the rematch offer
//               sendToRoom(roomId, {
//                 event: 'rematchOffered',
//                 data: { playerId: user.userId }
//               });
//               break;
//             }
  
//             case 'acceptRematch': {
//               const { roomId } = data.data;
//               const room = getRoom(roomId);
//               if (!room) {
//                 ws.send(JSON.stringify({ event: 'error', data: { message: 'Room does not exist.' } }));
//                 return;
//               }
  
//               // Notify both players that the rematch is accepted
//               sendToRoom(roomId, {
//                 event: 'rematchAccepted',
//                 data: { message: 'Both players accepted the rematch.' }
//               });
  
//               // Logic to reset the game state for a new game
//               // This could involve resetting the room state, players, etc.
//               resetRoomForRematch(roomId);
//               break;
//             }
  
//             case 'rejectRematch': {
//               const { roomId } = data.data;
//               const room = getRoom(roomId);
//               if (!room) {
//                 ws.send(JSON.stringify({ event: 'error', data: { message: 'Room does not exist.' } }));
//                 return;
//               }
  
//               // Notify both players that the rematch is rejected
//               sendToRoom(roomId, {
//                 event: 'rematchRejected',
//                 data: { message: 'One player rejected the rematch.' }
//               });
  
//               // Logic to handle the rejection, e.g., dropping the room or returning to waiting state
//               dropRoom(roomId);
//               break;
//             }
  
//             default:
//               console.log('Unknown event in waiting room:', JSON.stringify(data));
//               break;
//           }
//         } catch (error) {
//           console.error('Error handling message in waiting room:', error);
//           ws.send(JSON.stringify({ event: 'error', data: { message: 'Error processing your request.' } }));
//         }
//       });
  
//       ws.on('close', () => {
//         const userId = user.userId;
//         console.log('Client disconnected from waiting room:', userId);
//         removeSocket(userId);
//       });
//     });
//   };
  
//   // Helper function to reset the room for a rematch
//   function resetRoomForRematch(roomId: string) {
//     const room = getRoom(roomId);
//     if (room) {
//       // Reset the game state, players, etc.
//       room.players = []; // Clear players for a new game
//       // Additional logic to reset game state can be added here
//     }
//   }
    