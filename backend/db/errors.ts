export class UsernameExists extends Error {
  constructor() {
    super('An account with this username already exists');
  }
}

export class EmailExists extends Error {
  constructor() {
    super('An account with this email already exists');
  }
}