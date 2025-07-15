// import { dbOperations } from '@/db/operations';
// import { getUserFromSession } from '@/lib/auth';
// import type { SendToRoom } from '@shared/Models/gameInfo';
// import { eventEmitter } from '@shared/utils/eventEmitter';
// import { Server, Socket } from 'socket.io';

// // Create a websocket connection for the waiting room
// // Store the user id and the websocket connection
// // Be prepared to send the user to a room when they are matched
// // Also allow for waiting when the game is finished for a rematch or new game
// // make a room map from id to ws
// // Create a state object to hold persistent data

// export type matchRoom = {
//     userMap: Map<string, Socket>;
// };
// const state: matchRoom = {
//     userMap: new Map<string, Socket>()
// };
// // Use state.userMap instead of userMap throughout your code
// function addToken(token: string, socket: Socket) {
//     if (state.userMap.has(token))
//         state.userMap.get(token)?.disconnect();
//     state.userMap.set(token, socket);
// }
// function removeToken(token: string) {
//     state.userMap.delete(token);
// }

// export function getToken(token: string): Socket | undefined {
//     return state.userMap.get(token);
// }

// const SendUserToRoom = async (data: any) => {

//     const { userId, roomId } = data;
//     const token = await dbOperations.getSessionFromUserId(userId);
//     if (!token) {
//         console.error('No token found');
//         return;
//     }
    
//     const socket = getToken(token);
    
//     if (!socket) {
//         console.error('User not found in map');
//         return;
//     }

//     socket.emit('sendToRoom', { roomId });
// };

// export function setupWaitingRoom(io: Server) {
//     io.use(async (socket, next) => {
//         try {
//             const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('sessionToken=')[1]?.split(';')[0];
            
//             if (!token) {
//                 return next(new Error('No token'));
//             }

//             addToken(token, socket);
//             console.log('UserMap:', state.userMap);
//             next();
//         } catch (error) {
//             next(new Error('Authentication failed'));
//         }
//     });

//     io.on('connection', (socket) => {
//         console.log('Client connected to waiting room:', socket.id);

//         socket.on('disconnect', async () => {
//             // remove from map
//             const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('sessionToken=')[1]?.split(';')[0];
//             if (token) {
//                 removeToken(token);
//             }
//         });
//     });
// }

// eventEmitter.sub('SendToRoom', SendUserToRoom);