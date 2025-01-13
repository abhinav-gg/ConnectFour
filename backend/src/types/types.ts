import type { UUID } from "crypto";

export type Room = {
  player1: UUID;
  player2: UUID;
  currentTurn: number; // 0 or 1 for fast reference
};

export type GameState = {
  rooms: Map<string, Room>;
};