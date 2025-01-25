import { GameInfo } from "@shared/Models/gameInfo";
import type { UUID } from "crypto";
import type express from "express";

export type Room = {
  players: UUID[];
  gameInfo: GameInfo;
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