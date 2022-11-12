import { LocalHubServiceInterface } from "./events/LocalHubProviderInterface";
import { EventHub } from "./events/EventHub";
import { DuneEvent } from "./events/DuneEvent";
import { DebugProviderInterface } from "../renderer/serviceProviders/DebugProviderInterface";

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

  log(...args: any[]) { this.#sendLog('log', null, ...args) }
  info(...args: any[]) { this.#sendLog('info', null, ...args) }
  warn(...args: any[]) { this.#sendLog('warn', null, ...args) }
  error(...args: any[]) { this.#sendLog('error', new Error().stack ?? '', ...args) }

  #sendLog(style: string, stack: string|null, ...msgs: any[]): void {
    console.info('blah');
    if (!this.#hub) return;
    if (this.#debugFlag) this.#hub.trigger(new DuneEvent(`${this.#receiver}/${this.#loggerName}Log`, { msgs, style, stack })); 
    if (this.#logToConsole && console[style]) console[style](...msgs);
  }

}