export class EmailSendError extends Error {
    constructor() {
      super('Couldn\'t sent email');
    }
  }