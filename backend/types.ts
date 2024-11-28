import type { UUID } from "crypto";

export type Room = {
  players: Array<UUID>; // max 2 players
  currentTurn: number;
};

export type RoomID = string;