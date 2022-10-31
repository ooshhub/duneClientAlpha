// TODO: create a DunEvent class & type to pass in to trigger

import { DuneEvent } from "./DuneEvent";

export interface LocalHubServiceInterface {

  name: string,

  trigger: (duneEvent: DuneEvent) => void;

  on: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;

  once: (eventName: string, callback: (...args:any[]) => any, priority?: number) => void;

  off: (eventName: string, callback: (...args:any[]) => any) => void;

  for: (destination: string, callback: (...args:any[]) => any, priority?: number) => void;
  
}