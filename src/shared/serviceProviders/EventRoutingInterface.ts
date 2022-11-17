import { DuneEvent } from "../events/DuneEvent";

export enum eventDomains {
  MAIN = 'main',
  RENDERER = 'renderer',
  SERVER = 'server',
}

export interface EventRoutingInterface {
  receiveEvent: (domain: eventDomains, event: DuneEvent) => void;
}