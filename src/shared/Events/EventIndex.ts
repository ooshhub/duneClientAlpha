import { EventHub } from "./EventHub";
import { LocalHubServiceInterface } from "./LocalHubProviderInterface";
import { Helpers } from "../Helpers";

export class EventIndex {

  static #eventHub: EventHub|LocalHubServiceInterface;

  static set eventHub(eventHub: EventHub|LocalHubServiceInterface) {
    EventIndex.#eventHub = EventIndex.#eventHub ?? eventHub;
  }

  static registerEvents(eventNames: string|string[], handler: anyFunction) {
    eventNames = Helpers.toArray(eventNames);
    if (EventIndex.#eventHub) {
      eventNames.forEach(eventName => EventIndex.#eventHub.on(eventName, handler));
    }
    else console.warn('dune error');
  }

}

