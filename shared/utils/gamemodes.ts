import { GameMode } from "@shared/constants/allgamemodes";
import { AvgGameLength } from "@shared/constants/game";
import { TimeControl, TimeCategory } from "@shared/types/game";
import { validateTimeControl } from "./validation";

export const sRankedModes = new Set([
  GameMode.STANDARD_BULLET_RANKED,
  GameMode.STANDARD_BLITZ_RANKED,
  GameMode.STANDARD_RAPID_RANKED
]);

export const sRankedArmageddonModes = new Set([
  GameMode.STANDARD_ARMAGEDDON_BULLET_RANKED,
  GameMode.STANDARD_ARMAGEDDON_BLITZ_RANKED,
  GameMode.STANDARD_ARMAGEDDON_RAPID_RANKED
]);

// Define categories for gamemodes
export const CompetitiveModes = new Set([
  ...sRankedModes,
  ...sRankedArmageddonModes,
]);

export const CasualModes = new Set([
  GameMode.STANDARD_PUBLIC_CASUAL,
  GameMode.STANDARD_ARMAGEDDON_PUBLIC_CASUAL,
  GameMode.STANDARD_FRIENDLY,
  GameMode.STANDARD_ARMAGEDDON_FRIENDLY,
]);


// CategoriseTime takes a time control object and returns the game category
// (TODO: define time control object, then function is done)


export function CategoriseTime(timeControl: TimeControl): TimeCategory {
  // Calculate total game time in seconds:
  // 2 * base time (both players) + disadvantage + increment * total moves
  if (!validateTimeControl(timeControl)) {
    throw new Error("Invalid time control settings");
  }

  const totalTime = (2 * timeControl.base_time) +
    timeControl.disadvantage + (timeControl.increment * AvgGameLength);


  // Categorize based on total game time:
  // Hyper Bullet: ≤ 60 seconds
  // Bullet: ≤ 255 seconds 
  // Blitz: 256-500 seconds 
  // Rapid: ≥ 650 seconds 
  if (totalTime <= 60) {
    return 'hyper-bullet';
  } else if (totalTime <= 255) {
    return 'bullet';
  } else if (totalTime <= 500) {
    return 'blitz';
  } else {
    return 'rapid';
  }
}

export function getRankedGameModeByTimeControl(timeControl: TimeControl, base: "standard" | "armageddon"): number {
  if (!validateTimeControl(timeControl)) {
    throw new Error("Invalid time control settings");
  }
  const category = CategoriseTime(timeControl);

  switch (base) {
    case 'standard':
      switch (category) {
        case 'hyper-bullet':
        case 'bullet':
          return GameMode.STANDARD_BULLET_RANKED;
        case 'blitz':
          return GameMode.STANDARD_BLITZ_RANKED;
        case 'rapid':
          return GameMode.STANDARD_RAPID_RANKED;
        default:
          throw new Error("Unknown time category");
      }
    case 'armageddon':
      switch (category) {
        case 'bullet':
          return GameMode.STANDARD_ARMAGEDDON_BULLET_RANKED;
        case 'blitz':
          return GameMode.STANDARD_ARMAGEDDON_BLITZ_RANKED;
        case 'rapid':
          return GameMode.STANDARD_ARMAGEDDON_RAPID_RANKED;
        default:
          throw new Error("Unknown time category");
      }
    default:
      throw new Error("Invalid base type, must be 'standard' or 'armageddon'");
  }
}



