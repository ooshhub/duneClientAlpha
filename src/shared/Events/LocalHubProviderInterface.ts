// TODO: create a DunEvent class & type to pass in to trigger

import { EventRouting } from "../../renderer/net/EventRouting";
import { DuneEvent } from "./DuneEvent";

export interface LocalHubServiceInterface {

  name: string,

  trigger: (duneEvent: DuneEvent) => void;

  on: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;

  once: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;

  off: (eventName: string, callback: (...args:any[]) => any) => void;

  registerEventRouter: (router: EventRouting) => void;

  passToEventRouting: (destination: string, event: DuneEvent) => Promise<void>;
  
}