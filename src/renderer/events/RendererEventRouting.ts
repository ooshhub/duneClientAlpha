import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { LocalHubServiceInterface } from "../../shared/events/LocalHubProviderInterface";
import { eventDomains } from "../../shared/events/EventRoutingInterface";
import { IpcMessagingInterface } from "../serviceProviders/IpcMessagingInterface";
import { ServerLinkProviderInterface } from "../serviceProviders/ServerLinkProviderInterface";
import { ServiceProviderRegistry } from "../serviceProviders/ServiceProviderRegistry";
import { EventRouting } from "../../shared/events/EventRouting";

export class RendererEventRouting extends EventRouting {

  // External domains
  #serverLink: ServerLinkProviderInterface;
  #mainLink: IpcMessagingInterface;

  // Internal domain - send through API route index
  #rendererLink: LocalHubServiceInterface;

  constructor(eventRouterConfig: ServiceProviderRegistry) {
    if (EventRouting.instance) throw new Error(`Only one Event Router can be instantiated.`);
    // Register the services for sending
    super('rendererEventRouter');
    this.#serverLink = eventRouterConfig.serverLinkProvider;
    this.#mainLink = eventRouterConfig.ipcMessagingProvicer;
    this.#rendererLink = eventRouterConfig.localHubProvider;
    // Register with the services for receiving
    this.#serverLink.registerEventRouter(this);
    this.#mainLink.registerEventRouter(this);
    this.#rendererLink.registerEventRouter(this);

    if (!this.#serverLink || !this.#mainLink || !this.#rendererLink) throw new DuneError(ERRORS.SERVICE_PROVIDER_ERROR, [ 'server/main/renderer' ]);
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
        this.#mainLink.sendToMainProcess(event);
        break;
      }
      case eventDomains.RENDERER: {
        this.#rendererLink.trigger(event);
        break;
      }
      case eventDomains.SERVER: {
        this.#serverLink.sendToServer(event);
        break;
      }
      default: {
        console.error(new DuneError(ERRORS.UNKNOWN_EVENT_DOMAIN, [ domain ]))
      }
    }
  }

}