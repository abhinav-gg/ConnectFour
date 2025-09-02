export class EmailSendError extends Error {
  constructor() {
    super('Couldn\'t send email');
    this.name = "Email couldn't be sent";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}


export class GameNotFound extends Error {
  constructor() {
    super('Game not found');
    this.name = "GameNotFound";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BotNotFound extends Error {
  constructor() {
    super('Bot not found');
    this.name = "BotNotFound";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
