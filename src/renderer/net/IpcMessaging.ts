import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { EventRouting } from "../../shared/events/EventRouting";
import { eventDomains } from "../../shared/events/EventRoutingInterface";
import { IpcEvent } from "../../shared/events/IpcEvent";
import { IpcMessagingInterface } from "../serviceProviders/IpcMessagingInterface";

export class IpcMessaging implements IpcMessagingInterface {

  static instance: IpcMessaging;

  #router: EventRouting|null = null;

  constructor() {
    if (IpcMessaging.instance) throw new DuneError(ERRORS.ONLY_ONE_INSTANCE_ALLOWED, [this.constructor.name]);
    if (!window.rendererToHub) throw new DuneError(ERRORS.IPC_NOT_FOUND);
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

  registerEventRouter(eventRouter: EventRouting) {
    this.#router = eventRouter;
    this.#registerReceiveFromMainProcessListener();
    return true;
  } 

  async sendToMainProcess({ eventName, eventData }: DuneEvent) {
    window.rendererToHub.send('sendToMain', new IpcEvent(eventName, eventData));
  }

}