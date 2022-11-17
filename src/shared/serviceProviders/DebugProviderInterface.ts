import { EventHub } from "../events/EventHub";
import { LocalHubServiceInterface } from "../events/LocalHubProviderInterface";

export interface DebugProviderInterface {
  registerEventHub: (eventHub: EventHub|LocalHubServiceInterface) => void,
  log: (...args: any[]) => void,
  info: (...args: any[]) => void,
  warn: (...args: any[]) => void,
  error: (...args: any[]) => void,
  get isLinked(): boolean,
}

export interface DebugReceiverProviderInterface {
  get handlers(): string[];
  registerHandlers: anyFunction;
}