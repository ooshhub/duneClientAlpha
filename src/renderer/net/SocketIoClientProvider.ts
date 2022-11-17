import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { Helpers } from "../../shared/Helpers";
import { DebugProviderInterface } from "../serviceProviders/DebugProviderInterface";
import { EventRoutingInterface } from "../../shared/events/EventRoutingInterface";
import { ServerLinkProviderInterface } from "../serviceProviders/ServerLinkProviderInterface";
import { eventDomains } from "./RendererEventRouting";
import { SocketIoConnectionHandler } from "./SocketIoConnectionHandler";
import { Socket, io } from './lib/socket.io.esm.min.js';

  /**
   * Goals for this service provider are:
   * 
   * - setup a socket.io Client on request
   * - close a socket.io Client on request
   * - send and receive data from a socket server
   * - survive a refresh without dropping connection to server
   * 
   * - comply with ServerLinkServiceInterface to achieve this
   * 
   */

enum SocketStates {
  INIT = 'INIT',
  DISCONNECTED = 'DISCONNECTED',
  DESTROYED = 'DESTROYED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export type SocketConfigObject = {
  url: string,
  autoConnect: boolean,
  auth: {
    game: string,
    playerName: string,
    pid: string,
    password?: string,
    sessionToken?: string,
  },
  extraHeaders: {
    game: string,
    reconnect?: boolean,
  }
}


export class SocketIoClientProvider implements ServerLinkProviderInterface {

  #socket: Socket|null = null;
  #connectionErrorHandler: SocketIoConnectionHandler|null = null;

  #eventRouter: EventRoutingInterface|null = null;

  #socketState: SocketStates = SocketStates.INIT;

  #timeout = 10000;

  #debug: DebugProviderInterface|Console;

  constructor(socketProviderConfig: genericJson = {}) {
    this.state = SocketStates.INIT;
    this.#debug = socketProviderConfig.logger ?? console;
    this.debug.log(`Initialised socket client provider.`);
  }

  get debug(): Console|DebugProviderInterface { return this.#debug }
  get state(): SocketStates { return this.#socketState }
  set state(newState) { this.#socketState = newState }

  #registerSocketEventHandlers(): void {
    if (!this.#socket) throw new DuneError(ERRORS.SOCKET_NOT_FOUND);
    // Connection error handling
    const errorTypes = [ 'connect_error', 'reconnect_error', 'reconnect_failed', 'disconnect' ];
    errorTypes.forEach(errorType => this.#socket?.on(errorType, (eventData) => this.#connectionErrorHandler?.handleConnectionEvent({ eventName: errorType, eventData })));

    // Normal connection handling
    this.#socket.on('auth', this.#handleSocketAuth);
    this.#socket.on('connect', this.#handleSocketConnected);
    this.#socket.on('message', this.receiveFromServer);
  }

  registerEventRouter(eventRouter: EventRoutingInterface) {
    this.#eventRouter = eventRouter;
  }

  async connectToServer(socketConfig: SocketConfigObject) {
    if (this.state !== SocketStates.INIT && this.state !== SocketStates.DISCONNECTED) return false;
    this.#socket = io(socketConfig.url, {
      autoConnect: socketConfig.autoConnect ?? false,
			timeout: this.#timeout,
      auth: {
        game: 'dune',
				playerName: socketConfig.auth.playerName,
				pid: socketConfig.auth.pid,
				password: socketConfig.auth.password||'',
				sessionToken: socketConfig.auth.sessionToken||null,
      },
      extraHeaders: {
        game: 'dune',
        reconnect:socketConfig.extraHeaders.reconnect ?? false
      },
		});
    if (!this.#socket) throw new DuneError(ERRORS.SOCKET_NOT_FOUND);
    this.#registerSocketEventHandlers();
    this.#connectionErrorHandler = new SocketIoConnectionHandler();

    this.state = SocketStates.CONNECTING;
    this.debug.log(`Connecting to server...`);
    this.#socket.connect();
    let errorMessage = ``;

    await Promise.race([
      Helpers.timeout(this.#timeout),
      Helpers.watchCondition(() => this.#socket?.connected ?? false),
    ]).catch(err => errorMessage = err);

    if (!this.#socket.connected || errorMessage) {
      this.debug.warn(`Socket could not connect.\n${errorMessage}`);
      this.state = SocketStates.ERROR;
      this.#socket.close();
      return false;
    }
    this.state = SocketStates.CONNECTED;
    return true;
  }

  async sendToServer(event: DuneEvent) {
    if (!this.#socket?.connected) throw new DuneError(ERRORS.SOCKET_NOT_FOUND);
    this.#socket.send(event);
  }

  async receiveFromServer(event: DuneEvent) {
    if (!this.#eventRouter) throw new DuneError(ERRORS.EVENT_ROUTING_NOT_FOUND);
    this.#eventRouter.receiveEvent(eventDomains.RENDERER, event);
  }

  async #handleSocketAuth(authEvent: genericJson) {
    if (authEvent.isHost == null) {
      const err = new DuneError(ERRORS.AUTH_FAILED);
      this.debug.warn(err, 'error');
      this.destroyConnection();
      this.#eventRouter?.receiveEvent(eventDomains.RENDERER, new DuneEvent('authReject', err));
    } else {
      this.#debug.log([`Authenticated ${authEvent.isHost ? 'HOST' : 'PLAYER'} with server`]);
      // Start Lobby init event
      this.#eventRouter?.receiveEvent(eventDomains.RENDERER, new DuneEvent('authSuccess', authEvent));
    }
  }

  async #handleSocketConnected(connectEvent: genericJson) {
    this.debug.log(`Connection upgraded successfully.`, connectEvent);
  }

  async destroyConnection() {
    if (!this.#socket) throw new DuneError(ERRORS.SOCKET_NOT_FOUND);
    this.debug.log(`Destroying socket...`);
    this.#socket.close();
    this.state = SocketStates.DESTROYED;
  }

}