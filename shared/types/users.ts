

export interface UserProfile {
  username: string; // con4 username
  pfp?: string; // optional URL for the user's avatar image
  isAnonymous?: boolean; // true if the user is not logged in
  isAuthenticated?: boolean; // true if the user is logged in
  provider?: UserAccountProvider; // which auth provider the user used to log in (e.g. "L" for local, "G" for Google, "D" for Discord)
}

export interface PlayerData extends UserProfile {
  time: number;
  elo?: number;
}

export enum UserAccountProvider {
  Local = "L",
  Google = "G",
  Discord = "D"
}


