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

export class EmailExists extends Error {
  constructor() {
    super('An account with this email already exists');
  }
}