// Legacy:

import { DuneError } from "../errors/DuneError";
import { ERRORS } from "../errors/errorDefinitions";
import { DuneEvent } from "./DuneEvent";
import { EventRouting } from "./EventRouting";
import { eventDomains } from "../serviceProviders/EventRoutingInterface";
import { LocalHubServiceInterface } from "./LocalHubProviderInterface";

/**
 * @implements {LocalHubServiceInterface}
 */
export class EventHub implements LocalHubServiceInterface {

  #registeredEvents = {};
  #registeredOneTimeEvents = {};
  // #registeredDestinations = {};

  #router: EventRouting|null = null;

  constructor(name = 'NewHub') {
    this.name = name;
  }

  registerEventRouter(router: EventRouting) {
    this.#router = router;
		console.info(`Registered ${router.name} with ${this.name}`);
  }

  name: string;

  async once(eventName: string, callback: (...args: any[]) => any, priority?: number) {
    if (typeof(callback) !== 'function') return console.warn(`${this.name}: callback must be a function!`);
    if (!this.#registeredOneTimeEvents[eventName]) this.#registeredOneTimeEvents[eventName] = [];
    const targetIndex = priority ? Math.min(priority, this.#registeredOneTimeEvents[eventName].length - 1) : this.#registeredOneTimeEvents[eventName].length;
    this.#registeredOneTimeEvents[eventName][targetIndex] = callback;
  }

  /**
   * Register a function with the EventHub service
   * 
   * @param eventName
   * @param callback 
   * @param priority 
   * @returns 
   */
  async on(eventName: string, callback: (...args: any[]) => any, priority?: number) {
    if (typeof(callback) !== 'function') return console.warn(`${this.name}: callback must be a function!`);
    if (!this.#registeredEvents[eventName]) this.#registeredEvents[eventName] = [];
    const targetIndex = priority ? Math.min(priority, this.#registeredEvents[eventName].length - 1) : this.#registeredEvents[eventName].length;
    this.#registeredEvents[eventName][targetIndex] = callback;
  }

  async off(eventName: string, callback: (...args: any[]) => any) {
    if (this.#registeredEvents[eventName]) {
      if (!callback) this.#registeredEvents[eventName] = [];
      else this.#registeredEvents[eventName] = this.#registeredEvents[eventName].filter(cb => cb !== callback);
    }
  }

  // Supply a '/' in event name to signify a destination and send to a 'for' registered handler
  // 'main/requestHtml' will send the event to the 'for' handler 'main', with {event: requestHtml, data: {...args}} as parameters
  async trigger(duneEvent: DuneEvent) {
    const { eventName, eventData } = duneEvent;
    // console.log(eventName);
    // Check 'for' handlers first, to send event to correct event hub
    if (/\//.test(eventName)) {
      const parts = eventName.match(/^(\w+)\/(\w+)/);
      if (parts && parts[1] && parts[2]) this.passToEventRouting(parts[1], new DuneEvent(parts[2], eventData)).catch(e => console.warn(e.message));
      else console.warn(`${this.name}: Bad 'for' trigger: ${eventName}`);
    } else {
      // Check 'once' one time events next
			if (this.#registeredOneTimeEvents[eventName]?.length) {
				this.#registeredOneTimeEvents[eventName].forEach((cb, i) => {
					if (typeof cb !== 'function') console.log(`${this.name}: Error - oneTimeEvent[${i}] is not a function`, cb);
					else cb(duneEvent);
					this.#registeredOneTimeEvents[eventName][i] = null;
				});
				this.#registeredOneTimeEvents[eventName] = this.#registeredOneTimeEvents[eventName].filter(v=>v);
			}
      // And finally, normal 'on' events
      (this.#registeredEvents[eventName]||[]).forEach(cb => {
				if (typeof cb !== 'function') console.log(`${this.name}: Error - ${cb} is not a function`, this.#registeredEvents);
				else cb?.(duneEvent);
			});
    }
  }

  async passToEventRouting(destination: string, duneEvent: DuneEvent) {
    if (!this.#router) {
			console.warn(`${this.name}: ${ERRORS.EVENT_ROUTING_NOT_FOUND}, attempting local route`);
			this.trigger(duneEvent);
			return;
		}
    const domain = eventDomains[destination.toUpperCase()];
    if (!domain) throw new DuneError(ERRORS.UNKNOWN_EVENT_DOMAIN, [ destination ]);
    this.#router.receiveEvent(domain, duneEvent);
  }
}