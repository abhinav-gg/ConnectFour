import { GameInfo } from "@shared/Models/gameInfo";
import type { UUID } from "crypto";

export type Room = {
  players: UUID[];
  gameInfo: GameInfo;
  currentTurn: number;
};

export type RoomMap = {
  rooms: Map<string, Room>;
};