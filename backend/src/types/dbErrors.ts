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

export class PlayerNotLookingForGame extends Error {
  constructor() {
    super('Player not looking for game');
  }
}

export class EmailExists extends Error {
  constructor() {
    super('An account with this email already exists');
    this.name = "EmailExists";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmailDoesNotExist extends Error {
  constructor() {
    super('An account with this email doesn\'t exist');
    this.name = "EmailDoesNotExist";
    Object.setPrototypeOf(this, new.target.prototype);
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


export class EloNotFound extends Error {
  constructor() {
    super('Critical failure: Multiple games found for this query');
    this.name = "EloNotFound";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
