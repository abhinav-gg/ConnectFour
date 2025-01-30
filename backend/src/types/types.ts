import { GameInfo } from "@shared/Models/gameInfo";
import type { UUID } from "crypto";
import type express from "express";

export interface Glicko {
  elo: number;
  rating_deviation: number;  // Rating Deviation
  updated_at: number;
}

export type Room = {
  players: UUID[];
  spectators: UUID[];
  gameInfo: GameInfo;
  lastDisconnect?: number;
  gameOver?: boolean;
  drawing?: boolean;
  currentTurn: number;
};

export type RoomMap = {
  rooms: Map<string, Room>;
};

export type TimeInfo = {
  timeTaken: number, allowedTime: number, timeLeft: number, delta: number;
};

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}

export interface DiscordUserRequest extends express.Request {
  user?: DiscordUser;
}

export interface RecaptchaResponse {
  success: boolean;
  score: number;
}

export interface RequestWithRecaptcha extends express.Request {
  recaptchaResult?: RecaptchaResponse;
}