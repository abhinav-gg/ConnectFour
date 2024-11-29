import type { UUID } from "crypto"

export type Room = {
  players: Array<UUID>; // max 2 players
  currentTurn: number;
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

export type Message = JoinGame | MakeMove;

export type GameState = {
  rooms: Map<string, Room>;
};