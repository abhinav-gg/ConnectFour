import type express from "express";

export const UserSessionTTL = 60 * 60 * 24 * 7; // 7 days in seconds

export interface ServiceResponse {
  status: number;
  message: string;
}

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