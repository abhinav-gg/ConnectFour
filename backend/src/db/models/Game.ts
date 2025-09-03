import { z } from "zod";

export const GAME_SCHEMA = z.object({
  p: z.instanceof(Buffer),         // Game UUID as PK
  c: z.string().nullable(),        // Shortcode (nullable)
  u: z.array(z.string()),          // Ordered list of player IDs
  d: z.instanceof(Buffer),         // Game data (binary/base64)
  i: z.number(),                   // GameInfo 8 bytes INCLUDES THE TIME CONTROL AS WELL
  r: z.number(),                   // Result (4-bit number)
});

export const GAMEPLAYERS_SCHEMA = z.object({
  p: z.instanceof(Buffer),                    // Partition Key: player ID
  s: z.instanceof(Buffer),                    // Sort Key: game ID
  t: z.number(),                              // Local Sort Key: Timestamp (unix time)
  m: z.number(),                              // Local Sort Key: Gamemode ID (integer)
  e: z.number().optional().nullable(),        // Starting ELO
  d: z.number().optional().nullable(),        // Delta ELO (optional)
});

export const SHORTCODEMAP_SCHEMA = z.object({
  p: z.string(),                   // Shortcode as PK with prefix 's#'
  g: z.instanceof(Buffer),         // Game ID this shortcode maps to
});
