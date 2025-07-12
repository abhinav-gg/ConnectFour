// utils/eventEmitter.ts
export class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  sub(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  pub(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }

  unsub(event: string, listener: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }
}
