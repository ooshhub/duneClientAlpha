import { DuneEvent } from "../events/DuneEvent";

export interface IpcMessagingInterface {
	sendMessage: (event: DuneEvent) => Promise<void>;
}