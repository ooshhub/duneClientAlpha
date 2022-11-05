import { Helpers } from "../../../shared/Helpers";
import { DebugProviderInterface } from "../serviceProviders/DebugProviderInterface";
import { ServerLinkProviderInterface, SocketConnectionConfig } from "../serviceProviders/ServerLinkProviderInterface";
import { io, Socket, Manager } from './lib/socket.io.esm.min.js';
import { SocketIoConnectionHandler } from "./SocketIoConnectionHandler";

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
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
};


export class SocketIoClientProvider implements ServerLinkProviderInterface {

  #socketManager: Manager;
  #socket: Socket;
  #connectionErrorHandler: SocketIoConnectionHandler;

  #playerConfig: genericJson;
  #serverConfig: genericJson;

  #socketState: SocketStates = SocketStates.INIT;

  #debugger: DebugProviderInterface|Console;

  constructor(socketConfig: { player: genericJson, server: genericJson, eventRouting: }) {
    this.state = SocketStates.INIT;
    this.#serverConfig = socketConfig.server;
    this.#playerConfig = socketConfig.player;

    this.#socket = io(this.#serverConfig.url, {
      autoConnect: false,
			timeout: 10000,
      auth: {
        game: 'dune',
        playerName: this.#playerConfig.playerName,
        pid: this.#playerConfig.pid,
        password: this.#serverConfig.password||'',
        sessionToken: this.#serverConfig.sessionToken||null,
      },
      extraHeaders: {
        game: 'dune',
        reconnect: this.#serverConfig.reconnect||0,
      }
		});
    this.#socketManager = this.#socket.io;
    this.#connectionErrorHandler = new SocketIoConnectionHandler();

    this.#debugger = console;
    this.debug.log(`Initialised socket client.`);

    this.#registerSocketEventHandlers();
    if (this.#serverConfig.autoConnect) this.connectToServer();
  }

  get debug(): Console|DebugProviderInterface { return this.#debugger }
  get state(): SocketStates { return this.#socketState }
  set state(newState): void { this.#socketState = newState }

  #registerSocketEventHandlers(): void {
    // Connection error handling
    const errorTypes = [ 'connect_error', 'reconnect_error', 'reconnect_failed', 'disconnect' ];
    errorTypes.forEach(errorType => this.#socket.on(errorType, (eventData) => this.#connectionErrorHandler.handleConnectionEvent({ eventName: errorType, eventData })));

    // Normal connection handling
    this.#socket.on('auth', this.#handleSocketAuth);
    this.#socket.on('connect', this.#handleSocketConnected);
    this.#socket.on('message', this.receiveFromServer);
  }

  async connectToServer() {
    if (this.state !== SocketStates.INIT && this.state !== SocketStates.DISCONNECTED) return false;
    this.state = SocketStates.CONNECTING;
    this.debug.log(`Connecting to server...`);
    this.#socket.connect();
    let errorMessage = ``;
    await Promise.race([
      Helpers.timeout(this.#serverConfig.timeout),
      Helpers.watchCondition(() => this.#socket.connected),
    ]).catch(err => errorMessage = err);
    if (!this.#socket.connected || errorMessage) {
      this.debug.warn(`Socket could not connect.\n${errorMessage}`);
      this.state = SocketStates.ERROR;
      this.#socket.close();
      return false;
    }
    return true;
  }

  async sendToServer() {

  }

  async receiveFromServer() {

  }

  async #handleSocketAuth(authEvent: genericJson) {
    return false;
  }

  async #handleSocketConnected(connectEvent: genericJson) {
    return false;
  }

  async destroyConnection() {
    this.debug.log(`Destroying socket...`);
    this.#socket.close();
  }

}