export interface EloScore {
  rapid_elo: number;
  blitz_elo: number;
  bullet_elo: number;
}

// should be the type of DB where data is never deleted but timestamped so that we can see the history of the scores
// UserID -> EventID -> score: Int