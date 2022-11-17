import { createApp } from 'vue';
import { DuneEvent } from '../../shared/events/DuneEvent';
import App from './App.vue';
import { EventRouting } from '../net/RendererEventRouting';
import { ServiceProviderRegistry } from '../serviceProviders/ServiceProviderRegistry';

// Initialise Vue
const app = createApp(App);

// Register all Service Providers
const providerRegistry = new ServiceProviderRegistry,
  eventRouting = new EventRouting(providerRegistry);

const debug = providerRegistry.debugLogger,
  localHub = providerRegistry.localHubProvider;

// Assign globals
Object.assign(app.config.globalProperties, {
  $localHub: providerRegistry.localHubProvider,
  $debug: debug
});

app.mount('#app');

localHub.trigger(new DuneEvent('main/coreLoadComplete'));