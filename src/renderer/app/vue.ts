import App from './App.vue';
import { createApp } from 'vue';
import { DuneEvent } from '../../shared/events/DuneEvent';
import { RendererEventRouting } from '../events/RendererEventRouting';
import { ServiceProviderRegistry } from '../ServiceProviderRegistry/ServiceProviderRegistry';

// Initialise Vue
const app = createApp(App);

// Register all Service Providers
const providerRegistry = new ServiceProviderRegistry,
  eventRouting = new RendererEventRouting(providerRegistry);

const debug = providerRegistry.debugLogger,
  localHub = providerRegistry.localHubProvider;

// Assign globals
Object.assign(app.config.globalProperties, {
  $localHub: providerRegistry.localHubProvider,
  $debug: debug
});

app.mount('#app');

debug.log('hihi', eventRouting);
localHub.trigger(new DuneEvent({ eventName: 'main/coreLoadComplete' }));

localHub.request(new DuneEvent({ eventName: 'main/requestConfig' })).then(resp => {
	console.info(resp);
}).catch(err => {
	console.error(err);
}).finally(() => debug.log(`Huzzah!`));
