// import { Server, Socket } from "socket.io";
// import type { Room, RoomMap } from "@/types/types";
// import type { Error, GameStart, JoinGame, MakeMove, ServerMessage, MoveMade, 
//   PlayerDisconnected, PlayerJoined, StartTimer, ClientMessage, EndGame, PlayerTimeout, ReceiveMessage, SendMessage, 
//   PlayerReconnected,
//   OpponentReconnect,
//   DrawOffer} from "@shared/Types/websocketData";
// import { dbOperations } from "@/db/operations";
// import { getUserFromSession } from "@/lib/auth";
// import { UUID } from "crypto";
// import { EloChange, GameMode, PlayerData, SendToRoom, TimeControl } from "@shared/Models/gameInfo";
// import { StandardGameStates, StandardReconnectionTime } from "@shared/constants";
// import { GameState } from "@shared/utils/game";
// import { abortGame, assignGame, calculateTimesByMoves, endGame, safeGetElo } from "./gameHelper";
// import { replaceProfanities } from 'no-profanity';
// import { Game } from "@/models/Game";
// import { calculateGlickoRatings } from "./matchmaking";


// async function getCompetitiveEloChange(userId: string, opponentId: string, roomId: string): Promise<EloChange> {
//   const gamemodeId = await dbOperations.GetGameModeID(getGameMode(roomId)!);
//   const me = await safeGetElo(userId, gamemodeId);
//   const them = await safeGetElo(opponentId, gamemodeId);
//   return calculateGlickoRatings(me, them);
// }

// async function reconnect(roomId: string, userId: string, newSocket: Socket, isSpectator: boolean = false) {
//   // Check if the room is still ongoing
//   // If it is then add the new socket to the room and remove the old one
//   console.log('Reconnecting:', roomId, userId, isSpectator);
//   const game = await dbOperations.GetGameByShortCode(roomId);
//   if ((game.state !== StandardGameStates.scheduled &&
//     game.state !== StandardGameStates.ongoing)) {
//     throw new Error('Game is not ongoing');
//   }

//   const room = getRoom(roomId);
//   if (!room) throw new Error('Room does not exist???');
  
//   const usersock = getSocket(userId);
//   if (!usersock) throw new Error('no user???');
//   if (!usersock.username) {
//     await setupPlayer(userId);
//   }
  
//   // Gather all game data from the database
//   const lookup = await dbOperations.GetGameByPlayerLookup(userId);
//   const moves = await dbOperations.GetMovesByShortCode(roomId);
//   const p1 = room.players[0];
//   const timeControl = getTimeControl(roomId)!;
//   const gameMode = getGameMode(roomId)!;
//   let playerNumber = -1;
//   const roomPlayers = room.players.map(p => {
//     return { username: getUsernameByID(p),
//       time: calculateTimesByMoves(moves, p, timeControl, p!==p1).timeLeft
//     }});
//   let eloChanges: EloChange = emptyEloChange;

//   if (isSpectator) {
//     room.spectators.push(userId as UUID);
//     newSocket.emit('reconnection', {
//       playerNumber: playerNumber,
//       currentTurn: room.currentTurn,
//       players: roomPlayers as PlayerData[],
//       moves: moves.map(m => m.col) as number[]
//     });
//     return;

//   } else if (game.id === lookup) {

//     switch (gameMode.name.split('-')[0]) {
//       case 'standard': {
//         const opponentId = room.players[0] === userId ? room.players[1] : room.players[0];
//         eloChanges = await getCompetitiveEloChange(userId, opponentId, roomId);
//         break;
//       }
//       case 'friendly': {
//         break;
//       }
//     }
//     playerNumber = room.players.indexOf(userId as UUID);
//     // console.log(room, userId, playerNumber);
//     newSocket.emit('reconnection', {
//       eloChanges: eloChanges,
//       playerNumber: playerNumber,
//       currentTurn: room.currentTurn,
//       players: roomPlayers as PlayerData[],
//       moves: moves.map(m => m.col) as number[]
//     });
//   }
//   else {
//     throw new Error('Game is not ongoing');
//   }

//   // send PlayerReconnected to the other players
//   room.players.forEach(player => {
//     if (player !== userId) {
//       getSocket(player)?.socket.emit('opponentReconnect', { playerNumber: playerNumber });
//     }
//   });
// }

// function joinRoom(roomid: string, player: string) {
//   const room = getRoom(roomid);
//   if (room) {
//     room.players.push(player as UUID);
//   } else {
//     throw new Error(`This error shouldn't event be possible`);
//   }
// }

// function sendToRoom(roomId: string, event: string, data: any) {
//   const room = getRoom(roomId);
//   if (!room) return;

//   const playersAndSpectators = room.players.concat(room.spectators);
//   playersAndSpectators.forEach(playerId => {
//     const socket = getSocket(playerId)?.socket;
//     if (socket) {
//       socket.emit(event, data);
//     }
//   });
// }

// function getRoomOfPlayer(userId: string): string|null {
//   let found: string | null = null;
//   state.rooms.forEach((room, roomId) => {
//     if (room.players.includes(userId as UUID) || room.spectators.includes(userId as UUID))
//       found = roomId;
//   });
//   return found;
// }

// /////////////////////////////////////////////////////////////

// type verificationData = {
//   delta: number;
//   timeLeft: number;
//   turn: number;
//   nextPlayer: number;
//   draw: boolean;
//   winner: number | null;
// }

// async function verifyStandardGame(roomId: string, userId: string, col: number): Promise<verificationData> {
//   const timecontrol = getTimeControl(roomId)!;
//   const room = getRoom(roomId)!;
  
//   // Verify the correct player is sending the move
//   if (room.currentTurn !== room.players.indexOf(userId as UUID)) {
//     return {
//       delta: 0,
//       timeLeft: -1,
//       turn: -1,
//       nextPlayer: room.currentTurn,
//       draw: false,
//       winner: null
//     } as verificationData;
//   }
  
//   // Verify the time left here and calculate the time delta
//   const moves = await dbOperations.GetMovesByShortCode(roomId);
//   const turn = moves.length + 1;
//   room.currentTurn = room.currentTurn === 0 ? 1 : 0;
//   let { timeTaken, allowedTime, timeLeft, delta } = calculateTimesByMoves(moves, userId, timecontrol, 
//     room.currentTurn === 0);
  
//   if (moves.length == 0) {
//     return {
//       delta: 0,
//       timeLeft: timeLeft,
//       turn: 1,
//       nextPlayer: room.currentTurn,
//       draw: false,
//       winner: null
//     } as verificationData;
//   }
  
//   timeLeft += timecontrol.increment * 1000;
//   if (timeTaken >= allowedTime){
//     return {
//       delta: delta,
//       timeLeft: 0,
//       turn: turn,
//       nextPlayer: room.currentTurn,
//       draw: false,
//       winner: room.currentTurn
//     } as verificationData;
//   }

//   // Verify game here
//   const intMoves = moves.map(m => { return m.col }) as number[]
//   intMoves.push(col);
//   const gameState = new GameState();
//   intMoves.forEach((col) => {
//     let res = gameState.makeMove(col, true);
//     if (!res.success)
//       throw new Error('Invalid move');
//   });
//   if (gameState.gameOver) {
//     if (gameState.winner === null) {
//       return {
//         delta: delta,
//         timeLeft: timeLeft,
//         turn: turn,
//         nextPlayer: room.currentTurn,
//         draw: true,
//         winner: null
//       } as verificationData;
//     }
//     return {
//       delta: delta,
//       timeLeft: timeLeft,
//       turn: turn,
//       nextPlayer: room.currentTurn,
//       draw: false,
//       winner: room.currentTurn ? 0 : 1
//     } as verificationData;
//   }
//   else {
//     return {
//       delta: delta,
//       timeLeft: timeLeft,
//       turn: turn,
//       nextPlayer: room.currentTurn,
//       draw: false,
//       winner: null
//     } as verificationData;
//   }
// }

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// async function handleGameEnd(roomId: string, draw: boolean, message: string, winner?: number) {
//   // Simply close the websocket for this game because the room can never be reused
//   // players will be redirected to a new game id in the frontend if they want to rematch

//   console.log('GAME ENDING:', roomId, draw, message, winner);

//   const room = getRoom(roomId);
//   if (!room) return; // Strange error

//   room.gameOver = true;
//   sendToRoom(roomId, 'endGame', { 
//     winner: winner, 
//     draw: draw,
//     message: message 
//   });

//   // No real need to await this
//   endGame(roomId, room.gameInfo.gamemode, draw, winner);

//   // TODO: send user to the waiting websocket page.
//   // Mark game as finished depending on state
// };

// async function startNormalGame(room: Room, gamemode: GameMode, time_control: TimeControl) {
//   const p1Time: number = time_control!.base_time*60000;
//   const p2Time: number = p1Time + time_control!.disadvantage*1000; 

//   switch (gamemode.name.split('-')[0]) {
//     case 'standard': {
//       console.log(SocketIDs)
//       room.players.forEach(async (player, index) => {
//         getSocket(player)!.socket.emit('gameStart', {
//           eloChanges: getEloChange(player),
//           playerNumber: index,
//           players: [
//             { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
//             { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
//             ]
//         });
//       });
//       break;
//     }
//     case 'friendly': {
//       room.players.forEach((player, index) => {
//         getSocket(player)!.socket.emit('gameStart', {
//           eloChanges: emptyEloChange,
//           playerNumber: index,
//           players: [
//             { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
//             { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
//             ]
//         });
//       });
//       break;
//     }
//   }
//   room.spectators.forEach(spectator => {
//     getSocket(spectator)!.socket.emit('gameStart', {
//       eloChanges: {},
//       playerNumber: -1,
//       players: [
//         { username: getUsernameByID(room.players[0]!), time: p1Time } as PlayerData,
//         { username: getUsernameByID(room.players[1]!), time: p2Time } as PlayerData
//         ]
//     });
//   });
// }

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// export const setupGameEvents = async (io: Server) => {
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('sessionToken=')[1]?.split(';')[0];
      
//       if (!token) {
//         return next(new Error('Not Logged In'));
//       }

//       addSocket(token, socket);
//       const user = getUser(socket);
//       const auth = await getUserFromSession(user.token);
      
//       if (!auth.userId) {
//         return next(new Error('Not Logged In'));
//       }
      
//       user.userID = auth.userId;
//       next();
//     } catch (error) {
//       next(new Error('Authentication failed'));
//     }
//   });

//   io.on('connection', (socket) => {
//     console.log('Client connected:', socket.id);

//     socket.on('joinGame', async (data: JoinGame['data']) => {
//       try {
//         const { roomId } = data;
//         const userId = getUser(socket).userID;

//         console.log('Join Game:', roomId, userId);

//         if (!roomId || !userId) {
//           socket.emit('error', { message: 'Invalid data' });
//           return;
//         }

//         // Check if the user is already in the room
//         if (getRoomOfPlayer(userId) === roomId) {
//           await reconnect(roomId, userId, socket);
//           return; 
//         }

//         // Check if the current room is ongoing in database - if not then close websocket and instead use old game viewer
//         let game: Game;

//         try {
//           game = await dbOperations.GetGameByShortCode(roomId);

//           if (!game) {
//             socket.emit('error', { message: 'Game not found', redirect: '/game/setup' });
//             return;
//           } else if (game.short_id !== roomId) {
//             socket.emit('error', { message: 'Player in another game', redirect: `/game?room=${game.short_id}` });
//             return;
//           }

//           if (game.state === StandardGameStates.ongoing) {
//             // else let the user spectate the game
//             await reconnect(roomId, userId, socket, true);
//             return;
//           } else if (game.state !== StandardGameStates.scheduled) {
//             // TODO: replace with analysis later
//             socket.emit('error', { message: 'Game Ended', redirect: "/game/setup" });
//             return;
//           }
//         }
//         catch (error) {
//           console.log('Failed to check if game is ongoing:', error);
//           socket.emit('error', { message: 'Failed to check if game is ongoing', redirect: '/game' });
//           return;
//         }

//         // make the room cache if it doesn't exist (p1 join)
//         let gamemode = getGameMode(roomId);
//         let time_control = getTimeControl(roomId);
//         const roomExists = state.rooms.has(roomId);
//         try {
//           if (!roomExists) {
//             gamemode = await dbOperations.GetGameModeFromShortCode(roomId);
//             time_control = await dbOperations.GetTimeControlFromShortCode(roomId);
//             makeRoom(roomId, gamemode, time_control);
//           }
//         }
//         catch (error) {
//           console.log('Failed to check if room exists:', error);
//           socket.emit('error', { message: 'Failed to check if room exists', redirect: '/game' });
//           return;
//         }

//         const room = getRoom(roomId)!;
//         await setupPlayer(userId);

//         const StandardConnectUser = async () => {
//           joinRoom(roomId, userId);
//           const room = getRoom(roomId)!;
                            
//           socket.emit('playerJoined', { 
//             gameInfo: room.gameInfo,
//           });
          
//           // standard friendly gamemode starts with 2 players (current socket added above)
//           if (room.players.length === 2) {
//             switch (gamemode!.name.split('-')[0]) {
//               case 'standard': {
//                 const p1EChange = await getCompetitiveEloChange(room.players[0], room.players[1], roomId);
//                 const p2EChange = await getCompetitiveEloChange(room.players[1], room.players[0], roomId);
//                 setEloChange(room.players[0], p1EChange);
//                 setEloChange(room.players[1], p2EChange);
//                 break;
//               }
//               case 'friendly': {
//                 if (gamemode!.name === "friendly") { // friendly game
//                   room.players.forEach((player, index) => {
//                     assignGame(game.id, player, index);
//                   });
//                 }
//                 break;
//               }
//             }
//             await startNormalGame(room, gamemode!, time_control!);
//           }
//         }

//         ///////////////////// IMPORTANT ////////////////////////
//         // Check the user is one of the two players in the game
//         // If not then enter spectating mode, for now return

//         switch (gamemode!.name.split('-')[0]) {

//           case 'standard': {

//             // Check if the user is one of the players in the game
//             const gameLookup = await dbOperations.GetGameByPlayerLookup(userId);

//             if (!gameLookup || gameLookup !== game.id) {
//               // If not then enter spectating mode, for now return
//               reconnect(roomId, userId, socket, true);
//               return;
//             }

//             await StandardConnectUser();
//             break;
//           }
//           case 'friendly': {

//             // Check that the user is free to join the room
//             try {

//               // REWRITE THE BELOW
//                 // Check if the user is already in a game
//                 // If not add them to gamelookup if they are not already in it
//               // Check that the room has room for another player
              
//               if (room.players.length >= 2){
//                 reconnect(roomId, userId, socket, true);
//                 return;
//               }
              
//               const gameLookup = await dbOperations.GetGameByPlayerLookup(userId);
//               if (gameLookup) {
//                 if (gameLookup !== game.id) {
//                   console.log("Found game by player:", userId, gameLookup);
//                   const theirGame = await dbOperations.GetGameByID(gameLookup);
//                   if (theirGame.state === StandardGameStates.ongoing) {
//                     socket.emit('sendToRoom', { roomId: theirGame.short_id });
//                     return;
//                   } else if (theirGame.state === StandardGameStates.scheduled) {
//                     await dbOperations.FinishedGameLookup(userId);
//                   }
//                 }
//               }
//               else {
//                 await dbOperations.BeginFindingGame(userId, game.game_info, game.id);
//               }
//             }
//             catch (error) {
//               console.error('Failed to check if user is free to join room:', error);
//               socket.emit('error', { message: 'Failed to check if user is free to join room' });
//               return;
//             }

//             // Player is connecting to the game for the first time.
//             // Send the game state to the player and update the room state

//             await StandardConnectUser();
//             // Assign the game to the players (for friendly game no elo change)
            
//             break;
//           }
//           default : {
//             // The game mode does not exist??
//             throw new Error('Game mode does not exist');
//           }
//         }
//       } catch (error) {
//         console.error('Error handling joinGame:', error);
//         socket.emit('error', { message: 'Join Game Error' });
//       }
//     });

//     socket.on('makeMove', async (data: MakeMove['data']) => {
//       try {
//         const { roomId, col } = data;
//         if (!roomId || (col === null)) {
//           socket.emit('error', { error: 'Invalid data by frontend' });
//           return;
//         }
//         const room = getRoom(roomId);
//         const userId = getUser(socket).userID;
        
//         if (!room || !userId || !(getRoomOfPlayer(userId))) {
//           // fix this to re-create the room by getting the user to refresh their page
//           socket.emit('error', { message: 'Invalid data on backend' });
//           return;
//         }
        
//         if (room.gameOver) return;
//         // The player and room have been fully verified
//         room.drawing = false; // cancel any draw offers
//         const gamemode = getGameMode(roomId);

//         let verification: verificationData;

//         switch (gamemode?.name.split('-')[0]) {
//           case 'friendly': 
//           case 'standard' : {

//             try {
//               verification = await verifyStandardGame(roomId, userId!, col);
//             }
//             catch (error) {
//               console.error('Failed to verify standard game:', error);
//               socket.emit('error', { message: 'Invalid Move' });
//               return;
//             }

//             break;
//           }
//           default: {
//             throw new Error('Game mode does not exist');
//           }
//         }

//         // much like chess.com we do not start the timer until the first move is made
//         if (verification.turn === -1) {
//           return;
//         } else if (verification.turn === 1) {
//           sendToRoom(roomId, 'startTimer', {});
//           await dbOperations.UpdateGameStatusByShortCode(roomId, StandardGameStates.ongoing);
//         }
        
//         if (verification.timeLeft <= 0) { 
//           handleGameEnd(roomId, false, `Player ${verification.nextPlayer + 1} timed out`, verification.winner!);
//         }

//         try {
//           // consider speed, will this write to the database in time for the next move??
//           const gameId = (await dbOperations.GetGameByShortCode(roomId))?.id;
//           await dbOperations.MakeMove(gameId, userId, verification.turn, col, verification.delta);
//         }
//         catch (error) {
//           console.error('Failed to send move to database');
//           return;
//         }

//         sendToRoom(roomId, 'moveMade', { 
//           nextPlayer: verification.nextPlayer, 
//           col: col,
//           timeLeft: verification.timeLeft
//         });

//         if (verification.draw) {
//           handleGameEnd(roomId, true, 'Game Over', -1);
//         } else if (verification.winner !== null) {
//           handleGameEnd(roomId, false, 'Game Over', verification.winner);
//         }            
//       } catch (error) {
//         console.error('Error handling makeMove:', error);
//         socket.emit('error', { message: 'Move Error' });
//       }
//     });

//     socket.on('sendMessage', async (data: SendMessage['data']) => {
//       try {
//         const { roomId, message } = data;
//         const userId = getUser(socket)?.userID;
//         if (!getRoomOfPlayer(userId!)) throw new Error('User is not in the room to chat');

//         if (!roomId || !message) {
//           socket.emit('error', { message: 'Invalid data' });
//           return;
//         }
//         //const filter = new Filter();
//         const cleanedMessage = replaceProfanities(message);

//         const playerNum = getRoom(roomId)!.players.indexOf(userId as UUID);
//         if (playerNum === -1) throw new Error('Room Index Failed');
//         sendToRoom(roomId, 'receiveMessage', { playerNumber: playerNum, message: cleanedMessage });
//       } catch (error) {
//         console.error('Error handling sendMessage:', error);
//         socket.emit('error', { message: 'Message Error' });
//       }
//     });

//     socket.on('playerTimeOut', async (data: { roomId: string }) => {
//       try {
//         // Check the player really did timeout and then end the game

//         const roomId = data.roomId;
//         const room = getRoom(roomId);
//         if (room!.gameOver) return;
//         const user = getUser(socket)?.userID
//         if (!(getRoomOfPlayer(user!) === roomId)){
//           console.error("Player is not in the room");
//           return;
//         }

//         const timecontrol = getTimeControl(roomId)!;
//         const moves = await dbOperations.GetMovesByShortCode(roomId);
//         const player = room!.players[room!.currentTurn];
//         const index = room!.currentTurn;

//         const { timeLeft } = calculateTimesByMoves(moves, player, timecontrol, index===1);
//         if (timeLeft <= 0) {
//           const timeOutName = getUsernameByID(room!.players[index]);
//           handleGameEnd(roomId, false, `${timeOutName} timed out`, index===0 ? 1 : 0);
//           return;
//         }
//       } catch (error) {
//         console.error('Error handling playerTimeOut:', error);
//         socket.emit('error', { message: 'Timeout Error' });
//       }
//     });

//     socket.on('opponentAbandoned', async (data: { roomId: string }) => {
//       try {
//         // Check time since they left
//         const roomId = data.roomId;
//         const user = getUser(socket)?.userID
//         if (!(getRoomOfPlayer(user!) === roomId)){
//           console.error("Player is not in the room");
//           return;
//         }
//         const room = getRoom(roomId)!;
//         if (room.gameOver) return;
//         const gamemode = getGameMode(roomId)!;

//         const findDisconnectedPlayers = room.players.filter(p => !getSocket(p));
//         if (findDisconnectedPlayers.length === 0) {
//           reconnect(roomId, user!, socket, true);
//           return;
//         }
//         const timeSince = Date.now() - room.lastDisconnect!;
//         if (timeSince < StandardReconnectionTime) {
//           sendToRoom(roomId, 'error', { message: 'Opponent has time to reconnect' });
//           return;
//         }

//         switch (gamemode.name.split('-')[0]) {
//           case 'friendly':
//           case 'standard': {
//             if (findDisconnectedPlayers.length === 1) {
//               const winner = room.players.indexOf(findDisconnectedPlayers[0]) === 0 ? 1 : 0;
//               handleGameEnd(roomId, false, 'Opponent abandoned', winner);
//             } else {
//               throw new Error('Both players are disconnected or something stranger is happening');
//             }
//             break;
//           }
//         }
//       } catch (error) {
//         console.error('Error handling opponentAbandoned:', error);
//         socket.emit('error', { message: 'Abandon Error' });
//       }
//     });

//     socket.on('resign', async (data: { roomId: string }) => {
//       try {
//         const roomId = data.roomId;
//         const user = getUser(socket)?.userID;
//         if (!(getRoomOfPlayer(user) === roomId)) throw new Error('User is not in the room to timeout');
//         const moves = await dbOperations.GetMovesByShortCode(roomId);
//         if (moves.length === 0) {
//           socket.emit('error', { message: 'Cannot resign on the first move (ya nerd)' });
//         }
//         const room = getRoom(roomId)!;
//         if (room.gameOver) return;
//         const player = room.players.indexOf(user as UUID);
//         const winner = player === 0 ? 1 : 0;
//         handleGameEnd(roomId, false, 'Player resigned', winner);
//       } catch (error) {
//         console.error('Error handling resign:', error);
//         socket.emit('error', { message: 'Resign Error' });
//       }
//     });

//     socket.on('offerDraw', async (data: { roomId: string }) => {
//       try {
//         const roomId = data.roomId;
//         const user = getUser(socket)?.userID;
//         if (!(getRoomOfPlayer(user) === roomId)) throw new Error('User is not in the room to timeout');
//         const room = getRoom(roomId)!;
//         if (room.gameOver) return;
//         const player = room.players.indexOf(user as UUID);
//         const opponent = player === 0 ? 1 : 0;
//         getSocket(room.players[opponent])?.socket.emit('drawOffer');
//         room.drawing = true;
//       } catch (error) {
//         console.error('Error handling offerDraw:', error);
//         socket.emit('error', { message: 'Draw Offer Error' });
//       }
//     });

//     socket.on('acceptDraw', async (data: { roomId: string }) => {
//       try {
//         const roomId = data.roomId;
//         const user = getUser(socket)?.userID;
//         if (!(getRoomOfPlayer(user) === roomId)) throw new Error('User is not in the room to timeout');
//         const room = getRoom(roomId)!;
//         if (room.gameOver) return;
//         if (!room.drawing) return;
//         handleGameEnd(roomId, true, 'Draw by agreement');
//       } catch (error) {
//         console.error('Error handling acceptDraw:', error);
//         socket.emit('error', { message: 'Accept Draw Error' });
//       }
//     });

//     socket.on('disconnect', async () => {
//       // gracefully handle disconnections as player may reconnect
//       const userId = getUser(socket)?.userID;
//       console.log('Client disconnected:', userId);
      
//       // check if the user was in a game - if so then send a message to the other player
//       // TODO: if the other player is not connected then idfk
//       const roomId = getRoomOfPlayer(userId)
      
//       if (userId) {
//         removeSocket(userId);
//       }

//       if (!roomId) {
//         console.log("User was not in a room", state.rooms.keys());
//         return; // player was between rooms or seomthing
//       }

//       const room = getRoom(roomId!)!;

//       room.lastDisconnect = Date.now();

//       if (room.spectators.includes(userId as UUID)) {
//         // simply drop the spectator and continue
//         room.spectators = room.spectators.filter(p => p !== userId);
//         return
//       }

//       const game = await dbOperations.GetGameByShortCode(roomId!);
//       if (!game) {
//         console.error('Game not found:', roomId);
//         // simply drop the room and continue
//         dropRoom(roomId!);
//         return;
//       }

//       console.log('Game is scheduled:', game);
//       if (game.state === StandardGameStates.scheduled) {
//         dbOperations.KillGame(game.id);
//         sendToRoom(roomId, 'endGame', { draw: true, message: 'Game Was Abandoned', winner: null });
//         dropRoom(roomId);
//         return;
//       }

//       // Therefore the user is in a ongoing game
       
//       sendToRoom(roomId, 'playerDisconnected', {});

//       let active = 0;

//       room.players.forEach(player => {
//         if (getSocket(player)) {
//           active++;
//         }
//       });
  
//       // the player has some time to return if there are other players so do nothing
//       if (active === 0) {
//         await handleGameEnd(roomId, true, 'abandoned');
//         dropRoom(roomId);
//       }
//     });
//   });
// };
