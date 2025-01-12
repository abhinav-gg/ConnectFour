import type { UUID } from "crypto";

export type Room = {
  player1: UUID;
  player2: UUID;
  currentTurn: number; // 0 or 1
};

export type RoomID = string;

export type JoinGame = {
  event: 'joinGame';
  data: { roomId: RoomID; userId: UUID; };
};

export type MakeMove = {
  event: 'makeMove';
  data: { roomId: RoomID; col: number; };
};

export type EndGame = {
  event: 'endGame';
  data: { roomId: RoomID; };
};

export type Message = JoinGame | MakeMove | EndGame;

export type GameState = {
  rooms: Map<string, Room>;
};