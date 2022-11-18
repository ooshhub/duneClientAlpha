// TODO: create a DunEvent class & type to pass in to trigger

import { DuneEvent } from "./DuneEvent";
import { EventRouting } from "./EventRouting";

export interface LocalHubServiceInterface {

  name: string,

  trigger: (duneEvent: DuneEvent) => void;

  on: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;

  once: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;

  off: (eventName: string, callback: (...args:any[]) => any) => void;

  registerEventRouter: (router: EventRouting) => void;

  passToEventRouting: (destination: string, event: DuneEvent) => Promise<void>;

	request: (duneEvent: DuneEvent, timeout?: number) => Promise<DuneEvent|void>;
  
}