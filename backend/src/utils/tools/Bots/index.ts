import { GoatnusBot } from "./goatnus";
import { RandomBot } from "./randomBot";
import { BotNotFound } from "@/types/miscErrors";
import { Bots } from "@shared/constants/botinfo";
import { BotBase } from "./bot";
import { Game } from "@shared/types/game.types";

const allBots = [
  RandomBot,
  GoatnusBot
]

export const getBotById = (id: string, game: Game): BotBase => {
  if (!id) throw new Error('Invalid bot ID');

  const hasBot = Bots.some(bot => bot.id === id);
  if (!hasBot) throw new BotNotFound();

  const BotClass = allBots.find(bot => bot.id === id);
  if (!BotClass) throw new BotNotFound();

  return new BotClass(game);
}
