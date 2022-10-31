import { ServerLinkProviderInterface, SocketConnectionConfig } from "../serviceProviders/ServerLinkProviderInterface";
import { io } from './lib/socket.io.esm.min.js';

enum SocketStates {
  INIT = 'INIT',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
};


export class SocketIoClientProvider implements ServerLinkProviderInterface {

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

  #socket;

  #playerConfig: genericJson;
  #serverConfig: genericJson;

  #socketState: SocketStates = SocketStates.INIT;

  constructor(socketConfig: { player: genericJson, server: genericJson, eventRouting: }) {
    this.#serverConfig = socketConfig.server;
    this.#playerConfig = socketConfig.player;
    this.#socket = io(this.#serverConfig.url, {
      autoConnect: false,
			timeout: 5000,
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
  }

  async connectToServer() {

  }

  async sendToServer() {

  }

  async receiveFromServer

  async #handleConnectionError() {

  }

  async #handleDisconnect() {

  }

  async destroyConnection() {

  }

}