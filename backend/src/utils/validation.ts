import { UUID } from 'crypto'


export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const parseUser = (u: string): UUID | null => {
  // user is of the form user:UUID OR anon:
  // if anonymous, return null
  // otherwise get the UUID
  if (!u) return null;
  if (u === "anon:") return null;
  const match = /^user:([a-fA-F0-9-]{36})$/.exec(u);
  if (match) {
    return match[1] as UUID;
  }
  return null;
}

