import { DuneEvent } from "./DuneEvent";
import { eventDomains, EventRoutingInterface } from "./EventRoutingInterface";

export class EventRouting implements EventRoutingInterface {

  static instance: EventRoutingInterface;

  name: string;

  constructor(name) {
    this.name = name ?? 'EventRouter';
    this.#registerSelf();
  }

  #registerSelf() {
    EventRouting.instance = this;
  }

  /**
   * Receive an event from a domain and send it to the target domain
   * 
   * @param domain 
   * @param event 
   */
  async receiveEvent(domain: eventDomains, event: DuneEvent) {
    throw new Error(`recieveEvent must be overridden by subclass.`);
  }

}