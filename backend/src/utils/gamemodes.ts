import { GameMode } from "@shared/constants/allgamemodes";

export type GameModeCategory = 'competitive' | 'casual' | 'unknown';

// Define categories for gamemodes
const CompetitiveModes = new Set([
    GameMode.STANDARD_BULLET_RANKED,
    GameMode.STANDARD_BLITZ_RANKED,
    GameMode.STANDARD_RAPID_RANKED,
    // future competitive modes like ICH26 will be added here
  ]);
  
  const CasualModes = new Set([
    GameMode.STANDARD_CASUAL,
    // add casual modes here
  ]);
  
  // Helper function
export function getGameModeCategory(gamemode: GameMode): GameModeCategory {
    if (CompetitiveModes.has(gamemode)) return 'competitive';
    if (CasualModes.has(gamemode)) return 'casual';
    return 'unknown';
}