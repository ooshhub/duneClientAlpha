import { DebugReceiverProviderInterface } from "../renderer/serviceProviders/DebugProviderInterface";
import { EventIndex } from "../renderer/events/EventIndex";
import { DuneEvent } from "./events/DuneEvent";

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
  #defaultSources = { main: true, server: true, socket: true, renderer: true };
	#registeredHandlers: string[] = [];
	#logStyles: genericJson;
	#logSources: genericJson;

	constructor(sources?: genericJson, styles?: genericJson) {
		this.#logStyles = typeof(styles?.default) === 'string' ? styles : this.#duneDefaultStyles;
		this.#logSources = sources ?? this.#defaultSources;
	}

	registerHandlers() {
    const eventNames = Object.keys(this.#logSources).map(source => `${source}Log`);
		EventIndex.registerEvents(eventNames, (event: DuneEvent) => this.#processLog(event));
    this.#registeredHandlers.push(...eventNames);
	}
	get handlers() { return this.#registeredHandlers }
	// If ever required, can add methods to add or remove handlers.

	#processLog({ eventName, eventData }: DuneEvent) {
    if (!eventData) return;
    const { msgs, style, stack } = eventData,
      logSource = eventName.replace('Log', '');
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