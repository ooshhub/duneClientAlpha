import App from './App.vue';
import { createApp } from 'vue';
import { DuneEvent } from '../../shared/events/DuneEvent';
import { RendererEventRouting } from '../events/RendererEventRouting';
import { ServiceProviderRegistry } from '../ServiceProviderRegistry/ServiceProviderRegistry';
import { DuneError } from '../../shared/errors/DuneError';
import { ERRORS } from '../../shared/errors/errorDefinitions';

// Register all Service Providers
const providerRegistry = new ServiceProviderRegistry,
  eventRouting = new RendererEventRouting(providerRegistry);

const debug = providerRegistry.debugLogger,
  localHub = providerRegistry.localHubProvider;

localHub.trigger(new DuneEvent({ eventName: 'main/coreLoadComplete' }));

const vueProps: genericJson = {};

await localHub.request(new DuneEvent({ eventName: 'main/requestConfig' })).then(resp => {
	if (resp) vueProps.config = resp.eventData;
	else throw new DuneError(ERRORS.CONFIG_NOT_LOADED, [ 'main.ts'] );
	}).catch((err: Error) => {
		debug.error(err);
	});

// Initialise Vue
const app = createApp(App, vueProps);

app.provide('localHub', providerRegistry.localHubProvider);
app.provide('debug', debug);

app.mount('#app');