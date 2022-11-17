import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { EventRouting } from "../../shared/events/EventRouting";
import { eventDomains } from "../../shared/serviceProviders/EventRoutingInterface";
import { IpcEvent } from "../../shared/events/IpcEvent";
import { IpcMessagingInterface } from "../../shared/serviceProviders/IpcMessagingInterface";

export enum IpcOrigins {
	RENDERER = 'renderer',
	MAIN		 = 'main',
}

export class IpcMessaging implements IpcMessagingInterface {

  static instance: IpcMessaging;

  #router: EventRouting|null = null;
	name: string;

  constructor({ name, origin }: { name: string, origin: IpcOrigins }) {
    if (IpcMessaging.instance) throw new DuneError(ERRORS.ONLY_ONE_INSTANCE_ALLOWED, [this.constructor.name]);
    if (!window.rendererToHub) throw new DuneError(ERRORS.IPC_NOT_FOUND);
		this.name = name;
		this.#disableOwnChannel(origin);
    this.#registerSelf();
  }

  #registerReceiveFromMainProcessListener() {
    if (!this.#router?.receiveEvent) throw new DuneError(ERRORS.EVENT_ROUTING_NOT_LINKED, [this.constructor.name]);
    window.rendererToHub.receive('sendToRenderer', async ({eventName, eventData}: IpcEvent) => {
      this.#router?.receiveEvent(eventDomains.RENDERER, new DuneEvent(eventName, eventData));
    });
  }
  #registerSelf() {
    IpcMessaging.instance = this;
  }
	#disableOwnChannel(origin: IpcOrigins) {
		const disableFunction = async (...args:any[]) => { console.warn(`${this.name}: Tried to send IPC message to self`, ...args); };
		if (origin === IpcOrigins.RENDERER) this.sendToRenderer = disableFunction;
		else this.sendToMainProcess = disableFunction;
	}

  registerEventRouter(eventRouter: EventRouting) {
    this.#router = eventRouter;
    this.#registerReceiveFromMainProcessListener();
    return true;
  } 

  async sendToMainProcess({ eventName, eventData }: DuneEvent) {
    window.rendererToHub.send('sendToMain', new IpcEvent(eventName, eventData));
  }

	async sendToRenderer({ eventName, eventData}) {

	}

}