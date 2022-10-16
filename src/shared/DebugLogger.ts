import { DebugProviderInterface, DebugReceiverProviderInterface } from "../renderer/app/serviceProviders/DebugProviderInterface";
import { LocalHubServiceInterface } from "../renderer/app/serviceProviders/LocalHubProviderInterface";
import { EventHub } from "./EventHub";

// TODO: jsDocs, and provide a switch for turning logging on and off in both receiver and logger

// Create a new event-based logger. 
//		sourceName: provide a name to prefix console messages with. Must match a debugStyle in the receiver, or default will be used.
//		eventHubLink: a reference to the nearest eventHub to route the console logs through
// 		receiverHub: the name of the target eventHub which will receive the logs. Defaults to 'renderer'
// 		debugFlagLink: reference to a config flag to switch logging on and off.
// 		logToConsole: whether to also log directly to console.log()
export class DebugLogger implements DebugProviderInterface {

  #loggerName: string;
  #hub: EventHub | { trigger: dummyFunction };
  #debugFlag: boolean;
  #logToConsole: boolean;
  #receiver: string;

	constructor(sourceName: string, eventHubLink: EventHub|null, debugFlagLink = true, logToConsole = false, receiverHub = 'renderer') {
    this.#loggerName = sourceName;
    this.#hub = typeof eventHubLink?.trigger === 'function' ? eventHubLink : { trigger: () => console.error(`${sourceName}: broken hub link on debug logger.`) };
    this.#debugFlag = debugFlagLink;
    this.#logToConsole = logToConsole;
    this.#receiver = receiverHub;
	}

  get isLinked() { return ('on' in this.#hub) ? true : false }

  registerEventHub(eventHub: LocalHubServiceInterface): void {
    this.#hub = eventHub;
  }

  log(...args) { this.#sendLog('log', null, ...args) }
  info(...args) { this.#sendLog('info', null, ...args) }
  warn(...args) { this.#sendLog('warn', null, ...args) }
  error(...args) { this.#sendLog('error', new Error().stack ?? '', ...args) }

  #sendLog(style: string, stack: string|null, ...msgs: any[]): void {
    if (!this.#hub) return;
    if (this.#debugFlag) this.#hub.trigger(`${this.#receiver}/${this.#loggerName}Log`, { msgs, style, stack }); 
    if (this.#logToConsole && console[style]) console[style](...msgs);
  }

}

// Receiver for remote loggers. Lives on the rendererHub for dunePrototype.
// 		eventHubLink: local event hub which will be receiving remote logs
// 		sources: object containing key value pairs with source name and a truthy or falsy value.
// 				eg { example: 1 } would register for logs with the eventname 'exampleLog'
// 				value is checked at time of Event, so passing a reference to a live object allows live toggling without removing handler
// 		styles: provide custom styles. Shouldn't be needed for Dune, just use defaults
export class DebugReceiver implements DebugReceiverProviderInterface {
	#duneDefaultStyles = {
		main: 'background: yellow; color: black; padding:1px 5px 1px 5px; border-radius: 3px',
		server: 'background: purple; color: white; padding:1px 5px 1px 5px; border-radius: 3px',
		socket: 'background: darkblue; color: white; padding:1px 5px 1px 5px; border-radius: 3px',
		clientSockets: 'background: green; color: black; padding:1px 5px 1px 5px; border-radius: 3px', 
		renderer: 'background: orange; color: black; padding:1px 5px 1px 5px; border-radius: 3px',
		default: 'background: darkgreen; color: black; padding:1px 5px 1px 5px; border-radius: 3px',
		stack: `color: pink; font-weight: bold; background: #4e2c34; padding: 0px 6px 0px 6px; border: 1px solid darkred; border-radius: 2px;`,
	}
  #defaultSources = { main: 1, server: 1, socket: 1, renderer: 1 };
	#registeredHandlers: string[] = [];
	#logStyles: genericJson;
	#logSources: genericJson;
	#hubReference: EventHub|LocalHubServiceInterface|null;

	constructor(eventHubLink?: EventHub|null, sources?: genericJson, styles?: genericJson) {
		this.#logStyles = typeof(styles?.default) === 'string' ? styles : this.#duneDefaultStyles;
		this.#hubReference = eventHubLink ?? null;
		this.#logSources = sources ?? this.#defaultSources;
	}

  get isLinked() { return this.#hubReference === null ? false : true }

  registerEventHub(eventHub: LocalHubServiceInterface): void {
    this.#hubReference = eventHub;
  }
	registerHandlers() {
    if (this.#hubReference === null) {
      console.error(`${this.constructor.name}: Broken hub link` );
      return;
    }
		for (const src in this.#logSources) {
			if (this.#logSources[src]) {
				if (this.#hubReference.on) {
					this.#hubReference.on(`${src}Log`, (msgData) => this.#processLog(src, msgData));
					this.#registeredHandlers.push(`${this.#hubReference.name}||${src}Log`);
				}
			}
		}
	}
	get handlers() { return this.#registeredHandlers }
	// If ever required, can add methods to add or remove handlers.

	#processLog(logSource, { msgs, style, stack } ) {
		if (this.#logSources[logSource]) {
			(console[style]||console.log)(`%c${logSource}:`, this.#logStyles[logSource]||this.#logStyles.default||'', ...msgs);
			if (style === 'error' || stack) {
				console.groupCollapsed('%c-= stack.trace =-', this.#logStyles.stack);
				console.log(stack);
				console.groupEnd();
			}
		}
	}
}