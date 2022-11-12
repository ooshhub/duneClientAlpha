import { RouteGroup } from "../../shared/api/RouteGroup";
import { RouteIndex } from "../../shared/api/RouteIndex";
import { EventRouting } from "../net/EventRouting";
import { ServiceProviderRegistry } from "../serviceProviders/ServiceProviderRegistry";

// This can only call singletons or ServiceProviders from the ServiceRegistry for now.
// Can combine those into a better index later

export const initialiseRendererRoutes(providerRegistry: ServiceProviderRegistry, eventRouter: EventRouting) {

  const rendererApi = new RouteIndex('RendererApi', eventRouter, {
    debugger: providerRegistry.debugReceiver,
    // other services go here
    });

  rendererApi.group('debug', () => {
    rendererApi.route('rendererLog', 'debugger');
    debug.route('mainLog', 'debugger');
    debug.route('serverLog', 'debugger');
  });
}