export class EmailSendError extends Error {
    constructor() {
      super('Couldn\'t send email');
      this.name = "Email couldn't be sent";
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }