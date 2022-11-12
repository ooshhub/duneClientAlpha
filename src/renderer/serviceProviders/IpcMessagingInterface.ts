import { DuneEvent } from "../../shared/events/DuneEvent";
import { EventRouting } from "../net/EventRouting";

export interface IpcMessagingInterface {
  sendToMainProcess: (event: DuneEvent) => Promise<void>;
  registerEventRouter: (eventRouter: EventRouting) => void;
}