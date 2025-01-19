import { GameInfo } from "@shared/Models/gameInfo";

type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type RoomID = string;

/////////// SENT TO FRONTEND BY SERVER ///////////


export type RoomInfo = {
  roomId: RoomID; // to double check the user room is correct
  gameInfo: GameInfo; // to store for frontend to know what to display
};

export interface PlayerData {
  username: string;
  time: number;
  // in friendly games these simply won't be sent
  eloW: number | null;
  eloD: number | null;
  eloL: number | null;
};

export  type RoomFull = {
  event: 'roomFull';
};

export type GameStart = {
  event: 'gameStart';
  data: { 
    playerNumber: number;
    players: PlayerData[] 
  }; // return the ordered list of players
};

export type PlayerDisconnected = {
  event: 'playerDisconnected';
  data: { playersCount: number; };
};

export type MoveMade = {
  event: 'moveMade';
  data: { nextPlayer: number; col: number; timeLeft: number };
};

export type Draw = {
  event: 'draw';
  // Is data needed?
}

export type StartTimer = {
  event: 'startTimer';
};

export type PlayerJoined = {
  event: 'playerJoined';
  data: { playersCount: number; gameInfo: GameInfo; };
}

export type EndGame = {
  event: 'endGame';
  data: { winner: boolean; };
};

/////////// SENT TO SERVER BY FRONTEND ///////////

export type ResponseError = {
  event: 'error';
  data: { message: string; };
};

export type OfferDraw = {
  event: 'offerDraw';
  data: { roomId: RoomID; };
};

export type AcceptDraw = {
  event: 'acceptDraw';
  data: { roomId: RoomID; };
};

export type DeclineDraw = {
  event: 'declineDraw';
  data: { roomId: RoomID; };
};

export type Resign = {
  event: 'resign';
  data: { roomId: RoomID; };
};

export type OfferRematch = {
  event: 'offerRematch';
  data: { roomId: RoomID; };
};

export type JoinGame = {
  event: 'joinGame';
  data: { roomId: RoomID; };
};

export type MakeMove = {
  event: 'makeMove';
  data: { roomId: RoomID; col: number; };
};

export type Error = {
  event: 'error';
  data: { redirect: string | null; message: string; };
  
};

export type Message = JoinGame | MakeMove | EndGame | RoomFull | GameStart 
                    | PlayerDisconnected | MoveMade | PlayerJoined | StartTimer
                    | Error;
