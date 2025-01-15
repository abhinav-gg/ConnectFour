import { GameInfo } from "@shared/Models/gameInfo";
import type { UUID } from "crypto";

export type Room = {
  players: UUID[];
  gameInfo: GameInfo;
  //currentTurn: number;
};

export type GameState = {
  rooms: Map<string, Room>;
};