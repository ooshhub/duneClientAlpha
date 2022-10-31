export class IpcEvent {

  constructor(eventName: string, eventData?: genericJson|null) {
    this.eventData = eventData ?? {};
    this.eventName = eventName;
  }

  eventData: genericJson|null;
  eventName: string;
  type = 'IpcEvent';

}