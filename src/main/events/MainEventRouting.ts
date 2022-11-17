import { IpcMessagingInterface } from "../../shared/serviceProviders/IpcMessagingInterface";
import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { EventRouting } from "../../shared/events/EventRouting";
import { eventDomains } from "../../shared/serviceProviders/EventRoutingInterface";
import { LocalHubServiceInterface } from "../../shared/events/LocalHubProviderInterface";
import { DuneEvent } from "../../shared/events/DuneEvent";

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

	/**
   * Receive an event from a domain and send it to the target domain
   * 
   * @param domain 
   * @param event 
   */
	async receiveEvent(domain: eventDomains, event: DuneEvent) {
		switch(domain) {
			case eventDomains.MAIN: {
				this.#mainLink.trigger(event);
				break;
			}
			// TODO: send through API routes
			case eventDomains.RENDERER: {
				this.#rendererLink.sendToMainProcess(event);
				break;
			}
			default: {
				console.error(new DuneError(ERRORS.UNKNOWN_EVENT_DOMAIN, [ domain ]))
			}
		}
	}

}