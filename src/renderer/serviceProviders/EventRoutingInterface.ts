import { DuneEvent } from "../../shared/events/DuneEvent";
import { eventDomains } from "../net/EventRouting";



export interface EventRoutingInterface {
  receiveEvent: (domain: eventDomains, event: DuneEvent) => void;
}