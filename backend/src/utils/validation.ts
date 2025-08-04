import { PlayerIdentity } from '@/types/custom';
import { UUID } from 'crypto'


export const makeUserIdentity = (u: UUID): string => `user:${u}`;
export const makeAnonIdentity = (u: UUID): string => `anon:${u}`;
export const makeBotIdentity = (b: string): string => `bot:${b}`;


export const parseUser = (u: string): UUID | null => {
  // user is of the form user:UUID OR anon:
  // if anonymous, return null
  // otherwise get the UUID
  if (!u) return null;
  if (u.startsWith("anon:")) return null;
  const match = /^user:([a-fA-F0-9-]{36})$/.exec(u);
  if (match) {
    return match[1] as UUID;
  }
  return null;
}

export const isAnonIdentity = (id: string): boolean => id.startsWith("anon:")
export const isUserIdentity = (id: string): boolean => id.startsWith("user:")
export const isBotIdentity = (id: string): boolean => id.startsWith("bot:")

export const getIdentity = (id: string): PlayerIdentity => {
  if (isAnonIdentity(id)) {
    return { anon: id.slice(5) as UUID }
  }
  else if (isUserIdentity(id)) {
    return { user: id.slice(5) as UUID }
  }
  else if (isBotIdentity(id)) {
    return { bot: id.slice(4) }
  }
  return {}
}

export const getIdentityString = (id: PlayerIdentity): string => {
  if (id.user) return makeUserIdentity(id.user);
  if (id.anon) return makeAnonIdentity(id.anon);
  if (id.bot) return makeBotIdentity(id.bot);
  throw new Error('Invalid identity');
}
