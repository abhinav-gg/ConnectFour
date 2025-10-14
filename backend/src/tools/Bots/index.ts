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



export function getAllBotIds(): string[] {
  return Bots.map(bot => bot.id);
}

export function isValidBotId(id: string): boolean {
  return Bots.some(bot => bot.id === id);
}

export function getProBots(): BotType[] {
  return Bots.filter(bot => bot.isPro === true);
}

export const makeBotWithIDAndGame = (id: string, game: Game): BotBase => {
  if (!isValidBotId(id)) throw new Error('Invalid bot ID');

  const BotClass = allBots.find(bot => bot.id === id);
  if (!BotClass) throw new BotNotFound();

  return new BotClass(game);
}

export function getRegularBots(): BotType[] {
  return Bots.filter(bot => !bot.isPro);
}
