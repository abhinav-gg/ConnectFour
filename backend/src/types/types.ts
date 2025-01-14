import type { UUID } from "crypto";

export type Room = {
  players: UUID[];
  currentTurn: number;
};

export type GameState = {
  rooms: Map<string, Room>;
};