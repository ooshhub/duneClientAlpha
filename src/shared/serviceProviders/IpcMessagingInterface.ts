import { DuneEvent } from "../events/DuneEvent";
import { EventRouting } from "../events/EventRouting";
import { eventDomains } from "./EventRoutingInterface";

export interface IpcMessagingInterface {
	sendMessage: (event: DuneEvent) => Promise<void>;
	registerEventRouter: (eventRouter: EventRouting, hostDomain: eventDomains) => boolean;
}