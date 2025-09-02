import { EloChange } from "./game.types";
import { PlayerData } from "./users";

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
  moves: number[];
  shortcode: string;
  gamemode: number;
  rTimes: [number, number];
  lTime: number;
  players: PlayerData[];
  turn: number;
}

export interface PlayerDisconnection {
  playerNumber: number; // 0 for red, 1 for yellow
}



