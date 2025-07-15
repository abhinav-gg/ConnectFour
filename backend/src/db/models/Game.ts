import { TimeControl } from "@shared/types/game";
import { UUID } from "crypto"

export type GameInfo = {
    id: UUID;
    gamemode: string;
    base_time: number; // in seconds
    increment: number; // in seconds
    disadvantage: number; // in seconds
};

export interface Game{
  i: UUID,  // Game UUID as PK with prefix 'g#'
  s: string | null,                                   // Shortcode (nullable)
  p: string[],                // Ordered list of player IDs
  t: number,                                 // Timestamp (unix time)
  g: UUID, // GameInfo UUID ref
  d: string,                  // Game data (binary/base64)
  r: number                                           // Result (4-bit number)
}

export interface GamePlayer
{
  p: string,              // Player ID as PK with prefix 'p#'
  s: string,  // Sort key with prefix 'g#' + Game UUID
  d: number | null                    // Delta elo (optional)
}

export interface PlayerProgression
{
  p: string,              // Player ID as PK
  s: string,           // Aggregation prefix 'a#' + date in YYYYMMDD
  m: Record<any, number>; // Map of gameinfoId to ELO
}

export interface GameShortcode
{
  p: string,              // Shortcode as PK with prefix 's#'
  g: UUID  // Game ID this shortcode maps to
}




