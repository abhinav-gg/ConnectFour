import { EloChange } from "./game";
import { PlayerData } from "./users";


// Generic EventMessage utility
export type EventMessage<T = string, D = any> = {
  event: T;
  data: D;
};


export interface ChatMessage {
  id?: string
  username: string
  message: string
  type: "user" | "system" | "spectator"
  color?: "red" | "yellow" | "white"
  timestamp?: Date
}

export interface StandardGameMetadata {
  moves: number[];
  shortcode: string;
  gamemode: number;
  rTimes: [number, number];
  lTime: number;
  me: PlayerData;
  opponent: PlayerData;
  eloChanges: EloChange | null;
  turn: number;
  iRed: boolean;
}

export interface StandardGameMove {
  col: number;
  row: number;
  player: number; // 0 for red, 1 for yellow
  rTimes: [number, number]; // Remaining times for red and yellow players
  lMove: number; // Last move timestamp
}

export interface StandardSpectatingMetadata {
  shortcode: string;
  gamemode: number;
  rTimes: [number, number];
  lTime: number;
  red: PlayerData;
  yellow: PlayerData;
  turn: number;
}

export type ChatMessageEvent = EventMessage<'chatMessage', ChatMessage>;


// Game message types

export type GameStart = EventMessage<'gameStart', {
  eloChanges: EloChange;
  playerNumber: number;
  players: PlayerData[];
}>;

export type PlayerDisconnected = EventMessage<'playerDisconnected', {
  playersCount: number;
}>;

export type PlayerReconnected = EventMessage<'reconnection', {
  eloChanges: EloChange;
  playerNumber: number;
  currentTurn: number;
  players: PlayerData[];
  moves: number[];
}>;

export type OpponentReconnect = EventMessage<'opponentReconnect', {
  playerNumber: number;
}>;

// void used for empty payloads
export type PlayerTimeout = EventMessage<'playerTimeout', void>;

export type MoveMade = {
  event: 'moveMade';
  data: { nextPlayer: number; col: number; timeLeft: number };
};

export type Draw = {
  event: 'draw';
  data: {  };
}

export type DrawOffer = {
  event: 'drawOffer';
  data: {  };
}

export type StartTimer = {
  event: 'startTimer';
};

export type PlayerJoined = {
  event: 'playerJoined';
  data: {   };
}

export type EndGame = {
  event: 'endGame';
  data: { draw: boolean; winner: number | null; message: string; };
};

export type Error = {
  event: 'error';
  data: { redirect: string | null; message: string; };
};


export type ClientGameMessage = GameStart | PlayerDisconnected | PlayerReconnected

/////////// SENT TO SERVER BY FRONTEND ///////////

export type ResponseError = EventMessage<'error', {
  message: string;
}>;

export type IResign = EventMessage<'resign', {
  
}>;

export type OfferDraw = EventMessage<'offerDraw', {
  
}>;

export type AcceptDraw = EventMessage<'acceptDraw', {
  
}>;

export type MakeMove = EventMessage<'makeMove', {
  col: number;
}>;

export type SendMessage = EventMessage<'sendMessage', {
  message: string;
}>;


