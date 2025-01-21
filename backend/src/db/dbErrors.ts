export class UsernameExists extends Error {
  constructor() {
    super('An account with this username already exists');
  }
}

export class UsernameDoesntExist extends Error {
  constructor() {
    super('You must provide a valid username');
  }
}

export class PlayerEloNotFound extends Error {
  constructor() {
    super('Player elo not found');
  }
}

export class EmailExists extends Error {
  constructor() {
    super('An account with this email already exists');
  }
}

export class ShortCodeConflictError extends Error {
  constructor() {
    super('A short code with this name already exists, please regenerate');
  }
}

export class MultipleGamesFoundError extends Error {
  constructor() {
    super('Critical failure: Multiple games found for this query');
  }
}
