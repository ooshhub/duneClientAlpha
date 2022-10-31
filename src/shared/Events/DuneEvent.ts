export class DuneEvent {

  constructor(eventName: string, eventData?: genericJson|null) {
    if (!eventName) throw new Error(`${this.constructor.name} error: Must supply an event name`);
    this.eventName = eventName;
    this.eventData = eventData ?? {};
  }

  eventData: genericJson|null;
  eventName: string;
  type = 'DuneEvent';

}