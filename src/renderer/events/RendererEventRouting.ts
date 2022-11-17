import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { LocalHubServiceInterface } from "../../shared/events/LocalHubProviderInterface";
import { eventDomains } from "../../shared/serviceProviders/EventRoutingInterface";
import { IpcMessagingInterface } from "../../shared/serviceProviders/IpcMessagingInterface";
import { ServerLinkProviderInterface } from "../net/ServerLinkProviderInterface";
import { EventRouting } from "../../shared/events/EventRouting";
import { ServiceProviderRegistry } from "../ServiceProviderRegistry/ServiceProviderRegistry";

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
    this.#mainLink = eventRouterConfig.ipcMessagingProvider;
    this.#rendererLink = eventRouterConfig.localHubProvider;
    // Register with the services for receiving
    this.#serverLink.registerEventRouter(this);
    this.#mainLink.registerEventRouter(this, eventDomains.RENDERER);
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
        this.#mainLink.sendMessage(event);
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