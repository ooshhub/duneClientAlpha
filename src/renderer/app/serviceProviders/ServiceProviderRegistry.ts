/**
 * Service providers provide all functionality that isn't directly embedded in Vue components
 * Service providers cannot be written to
 */

import { LocalHubServiceInterface } from "./LocalHubProviderInterface";
// import { ServerLinkServiceInterface } from "./ServerLinkProviderInterface";

import { EventHub } from "../../../shared/EventHub";
import { DebugLogger, DebugReceiver } from "../../../shared/DebugLogger";
import { DebugProviderInterface, DebugReceiverProviderInterface } from "./DebugProviderInterface";

const defaultProviders = {
  localHubProvider: new EventHub('RendererHub'),
  debugLogger: new DebugLogger('Renderer', null),
  debugReceiver: new DebugReceiver(),
}
// TODO: create a dummy provider factory

export class ServiceProviderRegistry {

  // Primary Service Providers - required
  #localHubProvider: LocalHubServiceInterface;

  // Secondary Service Providers - can be dummy providers
  #debugLogger: DebugProviderInterface|DummyProvider;
  #debugReceiver: DebugReceiverProviderInterface|DummyProvider;
  // #audioProvider: ServiceProvider|DummyProvider

  constructor(
    localHubProvider: LocalHubServiceInterface = defaultProviders.localHubProvider,
    debugLogger: DebugProviderInterface = defaultProviders.debugLogger,
    debugReceiver: DebugReceiverProviderInterface = defaultProviders.debugReceiver,
  ) {
    this.#localHubProvider = localHubProvider;
    this.#debugLogger = debugLogger;
    if (!this.#debugLogger.isLinked) this.#debugLogger.registerEventHub(this.#localHubProvider);
    this.#debugReceiver = debugReceiver;
    if (!this.#debugReceiver.isLinked) this.#debugReceiver.registerEventHub(this.#localHubProvider);
  }

  get localHubProvider() { return this.#localHubProvider }
  get debugLogger() { return this.#debugLogger }

}