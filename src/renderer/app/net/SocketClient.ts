// Legacy:

import { io } from './lib/socket.io.esm.min.js';
import { Helpers } from '../../../shared/Helpers';
import { LocalHubServiceInterface } from '../../../shared/Events/LocalHubProviderInterface.js';

export class SocketClient {

	#clientState;
	#debug = 1;
	#validStates = {
		INIT: 'INIT',
		INIT_LOBBY: 'INIT_LOBBY',
		CONNECTING: 'CONNECTING',
		CONNECTED: 'CONNECTED',
		CLOSING: 'CLOSING',
		ERROR: 'ERROR'
	}

  #debugLogger;

  socket;
  serverOptions: genericJson;
  player: genericJson;

	constructor(clientOptions: genericJson) {
    this.player = {
      playerName: clientOptions.playerName || `newPlayer_${Math.floor(Math.random()*99)}`,
      pid: clientOptions.pid,
    };
    this.serverOptions = {
      hostIp: clientOptions.hostIp,
      hostPort: clientOptions.hostPort,
      selfJoin: clientOptions.selfJoin,
      localhost: clientOptions.selfJoin,
      url: `http://${clientOptions.selfJoin ? 'localhost' : clientOptions.hostIp}:${clientOptions.hostPort||8080}`,
      hostUrl: `http://${clientOptions.hostIp}:${clientOptions.hostPort||8080}`,
      path: clientOptions.path || '/',
      password: clientOptions.password||'',
    },
    this.#debugLogger = clientOptions.debugLogger ?? console;
		// Create base Socket
		this.#debugLogger(`Trying to connect to ${this.serverOptions.url}...`);
		this.socket = io(this.serverOptions.url, {
			autoConnect: false,
			timeout: 5000,
			auth: {
				game: 'dune',
				playerName: this.player.playerName,
				pid: this.player.pid,
				password: clientOptions.password||'',
				sessionToken: clientOptions.sessionToken||null,
			},
			extraHeaders: {
				game: 'dune',
				reconnect: clientOptions.reconnect||0,
			}
		});

		this.#setClientState('INIT');

		this.socket.on('message', (eventName: string, eventData: genericJson) => {
			this.#triggerHub(eventName, eventData);
		});

		// TODO: Connection handling
		// Dunno what's needed
		this.socket.on('disconnect', msg => this.#debugLogger('===Disconnected===', msg));
		this.socket.on('connect_error', (err) => {
			if (this.clientState === 'ERROR') return;
			this.#debugLogger(['ConnectionError', err], 'error');
			this.#setClientState('ERROR');
			// TODO: Display connection error modal
			let retries = 0;
      const checkTimer=1000;
			const errorTimeout = setInterval((maxRetries=5) => {
				if (this.socket.connected) {
					this.#setClientState('CONNECTED');
					clearInterval(errorTimeout);
				} else {
					retries++;
					if (retries > maxRetries) this.#triggerHub('main/cancelLobby');
				}
			}, checkTimer);
		});
		this.socket.on('error', msg => {
			this.#debugLogger(`state: ${this.#clientState}`);
			this.#debugLogger(['Error', msg], 'error');
		});
		this.socket.on('reconnect_error', msg => {
			this.#debugLogger(`state: ${this.#clientState}`);
			this.#debugLogger(msg);
		});
		this.socket.on('reconnect_failed', msg => {
			this.#debugLogger(`state: ${this.#clientState}`);
			this.#debugLogger(msg);
		});

		// Connection destroyed by angry server
		this.socket.on('deathnote', ({ msg }) => {
			this.#debugLogger(`state: ${this.#clientState}, this is probably where destroy() is failing sometimes???`);
			this.#triggerHub('serverKick', msg);
		});

		// Successful socket upgrade
		this.socket.on('connect', () => this.#debugLogger(`Connection Upgraded`));

		// Health check ack
		this.socket.on('healthCheck', (ack) => {
			this.#debugLogger(`${this.socket.id}: responding to ack req`);
			ack(1)
		});

		// Auth reply from server
		this.socket.on('auth', (playerDetails) => {
			// this.#debugLogger(`Auth received: ${data}`);
			if (playerDetails.isHost == null) {
				const err = new Error(`Bad auth reply from server`);
				this.#debugLogger(err, 'error');
				this.socket.close();
				this.#triggerHub('authReject', err);
			} else {
				this.player.isHost = playerDetails.isHost;
				this.#setClientState('INIT_LOBBY');
				this.#debugLogger([`Authenticated ${playerDetails.isHost ? 'HOST' : 'PLAYER'} with server`]);
				// Start Lobby init event
				this.#triggerHub('authSuccess', playerDetails);
			}
		});
	}

	#setClientState(newState) {
		this.#clientState = this.#validStates[newState] ?? this.#clientState;
	}
	get clientState() { return this.#clientState }

	async connectToGame(maxAttemptTime=8000) {
		if (this.clientState === 'CONNECTING' || this.socket.connected) return this.#debugLogger(`Already connected/connecting!`, 'warn');
		this.#setClientState('CONNECTING');
		this.#debugLogger(`Connecting...`);
		this.socket.connect();
		await Promise.race([
			Helpers.timeout(maxAttemptTime),
			Helpers.watchCondition(() => this.socket.connected)
		]);
		if (!this.socket.connected) {
			this.socket.close();
			this.#setClientState('ERROR');
			this.#debugLogger(`Connection timeout, server not found or connection upgrade refused`);
			return 0;
		} else return 1;
	}

	inLobby() { this.#setClientState('CONNECTED')	}

	async destroy() {
		this.#setClientState('CLOSING');
		this.socket.close();
    if ('destroyClient' in window.Dune) window.Dune.destroyClient();
		return true;
	}

	

	// Link to event hub
	#eventHub: LocalHubServiceInterface[] = [];
	registerEventHub(eventHubLink: LocalHubServiceInterface) {
		this.#eventHub.push(eventHubLink);
	}
	// Messages to hub
	async #triggerHub(eventName: string, eventData?: genericJson) {
		this.#eventHub.forEach(async (hubLink) => {
			hubLink.trigger(eventName, eventData);
		});
	}
	// Messages from hub
	async sendToServer(event, ...args) { 
		// this.#debugLogger(`socket: sending ${event} to server`);
		this.socket.send(event, ...args);
	}

}