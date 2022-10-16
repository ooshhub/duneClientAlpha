import { EventHub } from "../../../shared/EventHub";
import { LocalHubServiceInterface } from "./LocalHubProviderInterface";

export interface DebugProviderInterface {
  registerEventHub: (eventHub: EventHub|LocalHubServiceInterface) => void,
  log: (...args: any[]) => void,
  info: (...args: any[]) => void,
  warn: (...args: any[]) => void,
  error: (...args: any[]) => void,
  get isLinked(): boolean,
}

export interface DebugReceiverProviderInterface {
  registerHandlers: () => void;
  registerEventHub: (eventHub: EventHub|LocalHubServiceInterface) => void,
  get isLinked(): boolean,
  get handlers(): string[];
}