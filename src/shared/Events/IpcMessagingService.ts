import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { EventRouting } from "../../shared/events/EventRouting";
import { IpcMessagingInterface } from "../../shared/serviceProviders/IpcMessagingInterface";

export enum IpcOrigins {
	RENDERER = 'renderer',
	MAIN		 = 'main',
}

type ElectronIpcSender = (channel: string, ...args: any[]) => void;

export class IpcMessagingService implements IpcMessagingInterface {

  static instance: IpcMessagingService;

  #receiver: EventRouting|null = null;
	#dispatcher: any;
	name: string;

  constructor({ name, receiver, dispatcher, channelName }: { name: string, receiver: EventRouting, dispatcher: Electron.IpcRenderer, channelName: string }) {
    if (IpcMessagingService.instance) throw new DuneError(ERRORS.ONLY_ONE_INSTANCE_ALLOWED, [this.constructor.name]);
		this.name = name;
		this.#receiver = receiver;
		this.#dispatcher = dispatcher;
		this.#registerMessageListener();
    this.#registerSelf();
  }
  #registerSelf() {
    IpcMessagingService.instance = this;
  }

	#dispatchMessage(event: DuneEvent) {
		this.#dispatcher
	}

	registerEventRouter(eventRouter: EventRouting) {
    this.#router = eventRouter;
    this.#registerReceiveFromMainProcessListener();
    return true;
  } 

	async sendMessage(event: DuneEvent) {
		this.#dispatchMessage(event);
	}

}