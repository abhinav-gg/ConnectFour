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
    