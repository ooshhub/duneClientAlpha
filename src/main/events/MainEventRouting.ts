import { IpcMessagingInterface } from "../../renderer/serviceProviders/IpcMessagingInterface";
import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { EventRouting } from "../../shared/events/EventRouting";
import { EventRoutingInterface, eventDomains } from "../../shared/events/EventRoutingInterface";
import { LocalHubServiceInterface } from "../../shared/events/LocalHubProviderInterface";

export class MainEventRouting extends EventRouting {

  // External domain
  #rendererLink: IpcMessagingInterface;

  // Internal domain
  #mainLink: LocalHubServiceInterface

  constructor(ipcMessagingService: IpcMessagingInterface, localHubLink: LocalHubServiceInterface) {
    if (MainEventRouting.instance) throw new Error(`Only one Event Router can be instantiated.`);
    super('mainEventRouter');
    // Register the services for sending
    this.#mainLink = localHubLink;
    this.#rendererLink = ipcMessagingService;
    // Register with the services for receiving
    this.#mainLink.registerEventRouter(this);
    this.#rendererLink.registerEventRouter(this);

    if (!this.#mainLink || !this.#rendererLink) throw new DuneError(ERRORS.SERVICE_PROVIDER_ERROR, [ 'server/main/renderer' ]);
  }

}