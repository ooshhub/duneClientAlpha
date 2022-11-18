import { eventDomains } from "../serviceProviders/EventRoutingInterface";

type ReplyAddress = {
	domain: eventDomains,
	id: string,
};

export class DuneEvent {

  constructor({ eventName, eventData, reply, type, }:{ eventName: string, eventData?: genericJson|null, reply?: ReplyAddress, type?: string }|DuneEvent) {
    if (!eventName) throw new Error(`${this.constructor.name} error: Must supply an event name`);
    this.eventName = eventName ?? 'lostEvent';
    this.eventData = eventData ?? {};
		this.reply = reply ?? null;
		this.type = type ?? 'DuneEvent';
  }

  eventData: genericJson|null;
  eventName: string;
	reply: ReplyAddress|null;
  type: string;

}