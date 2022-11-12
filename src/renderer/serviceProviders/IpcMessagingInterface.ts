import { DuneEvent } from "../../shared/events/DuneEvent";
import { EventRouting } from "../../shared/events/EventRouting";

export interface IpcMessagingInterface {
  sendToMainProcess: (event: DuneEvent) => Promise<void>;
  registerEventRouter: (eventRouter: EventRouting) => void;
}