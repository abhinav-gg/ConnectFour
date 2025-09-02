// OpeningService.ts
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
  const res = await fetch(`/openings/${key}.json`);
  if (!res.ok) {
    return unknownOpening;
  }
  return res.json();
}