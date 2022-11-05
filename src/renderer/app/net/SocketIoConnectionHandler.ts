export type SocketIoConnectionEvent = {
  eventName: string,
  eventData: genericJson
}

enum SocketIoConnectionEventTypes {
  DISCONNECT        = 'disconnect',
  CONNECT_ERROR     = 'connect_error',
  RECONNECT_ERROR   = 'reconnect_error',
  RECONNECT_FAILED  = 'reconnect_failed',
}


export class SocketIoConnectionHandler {

  constructor() {}

  async handleConnectionEvent(socketEvent: SocketIoConnectionEvent) {
    const { eventName, eventData } = socketEvent;
    switch(eventName) {
      case SocketIoConnectionEventTypes.DISCONNECT: {
        this.#handleDisconnectEvent(eventData);
        break;
      }
      case SocketIoConnectionEventTypes.CONNECT_ERROR:
      case SocketIoConnectionEventTypes.RECONNECT_ERROR: {
        this.#handleConnectionError(eventData);
        break;
      }
      case SocketIoConnectionEventTypes.RECONNECT_FAILED: {
        this.#handleReconnectFailedEvent(eventData);
      }
      default: {
        console.warn(`Unknown SocketIO connection event handed to ${this.constructor.name}.`);
      }
    }
  }

  #handleDisconnectEvent(eventData: genericJson): boolean {
    return false;
  }

  #handleReconnectFailedEvent(eventData: genericJson): boolean {
    return false;
  }

  #handleConnectionError(eventData: genericJson): boolean {
    return false;
  }

  #handleException(eventData: genericJson): boolean {
    return false;
  }
}