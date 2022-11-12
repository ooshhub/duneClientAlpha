/**
 * Service providers provide all functionality that isn't directly embedded in Vue components
 * Service providers cannot be written to
 */

import { LocalHubServiceInterface } from "../../shared/events/LocalHubProviderInterface";
// import { ServerLinkServiceInterface } from "./ServerLinkProviderInterface";

import { EventHub } from "../../shared/events/EventHub";
import { DebugLogger } from "../../shared/DebugLogger";
import { DebugProviderInterface, DebugReceiverProviderInterface } from "./DebugProviderInterface";
import { ServerLinkProviderInterface } from "./ServerLinkProviderInterface";
import { SocketIoClientProvider } from "../net/SocketIoClientProvider";
import { IpcMessagingInterface } from "./IpcMessagingInterface";
import { IpcMessaging } from "../net/IpcMessaging";
import { DebugReceiver } from "../../shared/DebugReceiver";
import { EventIndex } from "../events/EventIndex";

const defaultProviders = {
  localHubProvider: new EventHub('RendererHub'),
  serverLinkProvider: new SocketIoClientProvider({ player: {}, server: {} }),
  ipcMessagingProvider: new IpcMessaging(),

  debugLogger: new DebugLogger('renderer', null),
  debugReceiver: new DebugReceiver,
}
// TODO: create a dummy provider factory?

export class ServiceProviderRegistry {

  // Primary Service Providers - required
  #localHubProvider: LocalHubServiceInterface;
  #serverLinkProvider: ServerLinkProviderInterface;
  #ipcMessagingProvider: IpcMessagingInterface;

  // Secondary Service Providers - can be dummy providers
  #debugLogger: DebugProviderInterface|DummyProvider;
  #debugReceiver: DebugReceiverProviderInterface|DummyProvider;
  // audio
  // mentat system
  // chat system

  constructor(
    localHubProvider: LocalHubServiceInterface = defaultProviders.localHubProvider,
    serverLinkProvider: ServerLinkProviderInterface = defaultProviders.serverLinkProvider,
    ipcMessagingProvider: IpcMessagingInterface = defaultProviders.ipcMessagingProvider,
    debugLogger: DebugProviderInterface = defaultProviders.debugLogger,
    debugReceiver: DebugReceiverProviderInterface = defaultProviders.debugReceiver,
  ) {
    // Set up local hub and route indexing first
    this.#localHubProvider = localHubProvider;
    EventIndex.eventHub = localHubProvider;
    // Then all other event messaging. Everything from here can rely on EventIndex routes being active
    this.#serverLinkProvider = serverLinkProvider;
    this.#ipcMessagingProvider = ipcMessagingProvider;

    // Then secondary providers
    this.#debugLogger = debugLogger;
    this.#debugReceiver = debugReceiver;
    
    if (!this.#debugLogger.isLinked) this.#debugLogger.registerEventHub(this.#localHubProvider);
    this.#debugReceiver.registerHandlers();

  }

  get localHubProvider() { return this.#localHubProvider }
  get serverLinkProvider() { return this.#serverLinkProvider }
  get ipcMessagingProvicer() { return this.#ipcMessagingProvider }

  get debugLogger() { return this.#debugLogger }
  get debugReceiver() { return this.#debugReceiver }

}