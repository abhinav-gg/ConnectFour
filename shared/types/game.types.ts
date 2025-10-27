import { t_GameMode } from "@shared/constants/allgamemodes";

export type Player = 0 | 1;
export type Cell = Player | null
export type Move = number
export type Seconds = number

export type TimedMoveResult = { 
  success: boolean, 
  row?: number; 
  deltaTime?: number
}

export type EloChange = {
  win: number;
  draw: number;
  loss: number;
}

export type TimeControl = {
  base_time: Seconds;
  increment: Seconds;
  disadvantage: Seconds;
}

export enum PlayAs {
  RED,
  YELLOW,
  RANDOM,
  FIT_IN
}

export type TimeCategory = "hyper-bullet" | "bullet" | "blitz" | "rapid";

export type GameInfo = {
  gamemode: number; // GameMode
  time_control: TimeControl;
}

export enum MoveClassification {
  BOOK              = 0,         
  BLUNDER           = 1,
  MISS              = 2,
  MISTAKE           = 3,
  GOOD              = 4,
  BEST              = 5,
  GREAT             = 6,
  BRILLIANT         = 7,
  UNCLASSIFIABLE    = 8
}

export type GameSetupParams = {
  gamemode: t_GameMode;
  time_control: TimeControl;
  playerColor: PlayAs;
  botId?: string; // Optional - flag for bot opponent game
}


// Base interface for standard game operations
export interface Game {
  getMoves(): number[];
  getBoard(): (number | null)[][];
  exportMoves(): string;
  getLegalMoves(): Move[];
  gameOver: boolean;
  currentPlayer: Player;
  cumulativeMoves(): any;
}
// Extended interface for games that support move navigation

export interface NavigableGame extends Game {
  getAllMoves(): number[];
  getCurrentMoveIndex(): number;
  setMoveIndex(index: number): boolean;
  adjMoveIndex(delta: number): boolean;
  getCurrentTimers(): [number, number];
}


