// OpeningService.ts
import { StandardGame } from "@shared/utils/Games/game";

export interface Opening {
    moves: string;
    name: string;
    description: string;
}

export const unknownOpening: Opening = {
  moves: "unknown",
  name: "Unknown Opening",
  description: "## This is an unknown opening.\nGo back in the move history to view what the origin of this position was.",
};

export async function fetchOpening(key: string): Promise<Opening> {
  const gameFromKey = new StandardGame(key);
  const id = gameFromKey.hashCode;
  const res = await fetch(`/openings/${id}.json`);
  if (!res.ok) {
    return unknownOpening;
  }
  return res.json();
}