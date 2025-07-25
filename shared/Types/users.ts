

export interface UserProfile {
    username: string; // con4 username
    pfp?: string; // optional URL for the user's avatar image
}

export enum UserAccountProvider {
  Local = "L",
  Google = "G",
  Discord = "D"
}


