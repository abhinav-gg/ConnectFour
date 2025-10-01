import { GoatnusBot } from "./goatnus";
import { RandomBot } from "./randomBot";
import { AdaptiveBot } from "./adaptiveBot";
import { BeginnerBot } from "./beginnerBot";
import { IntermediateBot } from "./intermediateBot";
import { ExpertBot } from "./expertBot";
import { VictorBot } from "./victorBot";
import { PerfectBot } from "./perfectBot";
import { BotNotFound } from "@/types/miscErrors";
import { Bots, BotType } from "@shared/constants/botinfo";
import { BotBase } from "./bot";
import { Game } from "@shared/types/game.types";

const allBots = [
  RandomBot,
  AdaptiveBot,
  BeginnerBot,
  IntermediateBot,
  ExpertBot,
  VictorBot,
  GoatnusBot,
  PerfectBot
]

export const getBotById = (id: string, game: Game): BotBase => {
  if (!id) throw new Error('Invalid bot ID');

  const hasBot = Bots.some(bot => bot.id === id);
  if (!hasBot) throw new BotNotFound();

  const BotClass = allBots.find(bot => bot.id === id);
  if (!BotClass) throw new BotNotFound();

  return new BotClass(game);
}

// Bot utility functions
export function getBotInfo(id: string): BotType | undefined {
  return Bots.find(bot => bot.id === id);
}

export function getAllBotIds(): string[] {
  return Bots.map(bot => bot.id);
}

export function isValidBotId(id: string): boolean {
  return Bots.some(bot => bot.id === id);
}

export function getBotsByRatingRange(minRating: number, maxRating: number): BotType[] {
  return Bots.filter(bot => bot.rating >= minRating && bot.rating <= maxRating);
}

export function getProBots(): BotType[] {
  return Bots.filter(bot => bot.isPro === true);
}

export function getRegularBots(): BotType[] {
  return Bots.filter(bot => !bot.isPro);
}
