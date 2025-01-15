// utils/eventEmitter.ts
class EventEmitter {
    private events: { [key: string]: Function[] } = {};
  
    on(event: string, listener: Function) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }
  
    emit(event: string, data?: any) {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(data));
      }
    }
  
    off(event: string, listener: Function) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(l => l !== listener);
      }
    }
  }
  
  export const eventEmitter = new EventEmitter();