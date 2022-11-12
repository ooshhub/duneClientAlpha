import { DuneError } from "../../shared/errors/DuneError";
import { ERRORS } from "../../shared/errors/errorDefinitions";
import { DuneEvent } from "../../shared/events/DuneEvent";
import { LocalHubServiceInterface } from "../../shared/events/LocalHubProviderInterface";
import { EventRoutingInterface } from "../serviceProviders/EventRoutingInterface";
import { IpcMessagingInterface } from "../serviceProviders/IpcMessagingInterface";
import { ServerLinkProviderInterface } from "../serviceProviders/ServerLinkProviderInterface";
import { ServiceProviderRegistry } from "../serviceProviders/ServiceProviderRegistry";

export enum eventDomains {
  MAIN = 'main',
  RENDERER = 'renderer',
  SERVER = 'server',
}

export class EventRouting implements EventRoutingInterface {

  static instance: EventRoutingInterface;

  name: string;

  // External domains
  #serverLink: ServerLinkProviderInterface;
  #mainLink: IpcMessagingInterface;

  // Internal domain - send through API route index
  #rendererLink: LocalHubServiceInterface;

  constructor(eventRouterConfig: ServiceProviderRegistry) {
    if (EventRouting.instance) throw new Error(`Only one Event Router can be instantiated.`);
    // Register the services for sending
    this.#serverLink = eventRouterConfig.serverLinkProvider;
    this.#mainLink = eventRouterConfig.ipcMessagingProvicer;
    this.#rendererLink = eventRouterConfig.localHubProvider;
    // Register with the services for receiving
    this.#serverLink.registerEventRouter(this);
    this.#mainLink.registerEventRouter(this);
    this.#rendererLink.registerEventRouter(this);

    if (!this.#serverLink || !this.#mainLink || !this.#rendererLink) throw new DuneError(ERRORS.SERVICE_PROVIDER_ERROR, [ 'server/main/renderer' ]);
    this.name = `Event Router`;
    this.#registerSelf();
  }

  #registerSelf() {
    EventRouting.instance = this;
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
      // TODO: send through API routes
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