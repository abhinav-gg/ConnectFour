import { GameInfo } from "@shared/Models/gameInfo";

type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type RoomID = string;

/////////// SENT TO FRONTEND BY SERVER ///////////


export type RoomInfo = {
  roomId: RoomID; // to double check the user room is correct
  gameInfo: GameInfo; // to store for frontend to know what to display
};

export  type RoomFull = {
  event: 'roomFull';
};

export type GameStart = {
  event: 'gameStart';
  data: { opponents: string[]; };
};

export type PlayerDisconnected = {
  event: 'playerDisconnected';
  data: { playersCount: number; };
};

export type MoveMade = {
  event: 'moveMade';
  data: { username: 0 | 1; col: number; delta: number; };
};

export type StartTimer = {
  event: 'startTimer';
  data: { username: string };
};

export type PlayerJoined = {
  event: 'playerJoined';
  data: { playersCount: number; };
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
  data: { message: string; };
};

export type Message = JoinGame | MakeMove | EndGame | RoomFull | GameStart | PlayerDisconnected | MoveMade | PlayerJoined | StartTimer;
