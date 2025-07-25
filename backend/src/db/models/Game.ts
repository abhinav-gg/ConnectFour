
export interface GAME
{
  p: Buffer,                                      // Game UUID as PK
  c: string,                                      // Shortcode (nullable)
  u: string[],                                    // Ordered list of player IDs
  d: Buffer,                                      // Game data (binary/base64)
  i: number,                                      // GameInfo 8 bytes INCLUDES THE TIME CONTROL AS WELL
  r: number                                       // Result (4-bit number)
}

export interface GAMEPLAYERS
{
  p: Buffer,                                      // Partition Key: player ID
  s: Buffer,                                      // Sort Key: game ID
  t: number,                                      // Local Sort Key: Timestamp (unix time)
  m: number,                                      // Local Sort Key: Gamemode ID (integer)
  e: number,                                      // Starting ELO
  d: number                                       // Delta ELO (optional)
}


export interface SHORTCODEMAP
{
  p: string,                                      // Shortcode as PK with prefix 's#'
  g: Buffer                                       // Game ID this shortcode maps to
}
