import { IpcMain, IpcRenderer, WebContents } from "electron";
import { DuneError } from "../errors/DuneError";
import { ERRORS } from "../errors/errorDefinitions";
import { DuneEvent } from "./DuneEvent";
import { EventRouting } from "./EventRouting";
import { IpcMessagingInterface } from "../serviceProviders/IpcMessagingInterface";
import { eventDomains } from "../serviceProviders/EventRoutingInterface";

type IpcInbound = {
	interface:  IpcMain|IpcRenderer;
	channelName: string;
}
type IpcOutbound = {
	interface:  WebContents|IpcRenderer;
	channelName: string;
}

export class IpcMessagingService implements IpcMessagingInterface {

  static instance: IpcMessagingService;

  #eventRouter: EventRouting|null = null;
	#ipcSender: IpcOutbound;
	#ipcReceiver: IpcInbound;
	#hostDomain: eventDomains|null = null;
	name: string;

  constructor(name: string, ipcSender: IpcOutbound, ipcReceiver: IpcInbound) {
    if (IpcMessagingService.instance) throw new DuneError(ERRORS.ONLY_ONE_INSTANCE_ALLOWED, [this.constructor.name]);
		this.name = name;
		this.#ipcSender = ipcSender;
		this.#ipcReceiver = ipcReceiver;
		this.#registerListener();
    this.#registerSelf();
  }
	#registerListener() {
		this.#ipcReceiver.interface.on(this.#ipcReceiver.channelName, (_ipcEvent: any, duneEvent: DuneEvent) => this.#receiveIpcMessage(duneEvent));
	}
  #registerSelf() {
    IpcMessagingService.instance = this;
  }

	registerEventRouter(eventRouter: EventRouting, hostDomain: eventDomains) {
    this.#eventRouter = eventRouter;
		this.#hostDomain = hostDomain;
    return true;
  }

	async #dispatchIpcMessage(event: DuneEvent) {
		// console.log('dispaych ipc', event);
		this.#ipcSender.interface.send(this.#ipcSender.channelName, event);
	}
	async #receiveIpcMessage(duneEvent: DuneEvent) {
		// console.log(duneEvent, 'ipc recd');
		if (this.#eventRouter && this.#hostDomain) {
			this.#eventRouter.receiveEvent(this.#hostDomain, duneEvent);
		}
		else {
			throw new DuneError(ERRORS.EVENT_ROUTING_NOT_FOUND, [ this.name ]);
		}
	}

	async sendMessage(event: DuneEvent) {
		this.#dispatchIpcMessage(event);
	}

}