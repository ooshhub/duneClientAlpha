import { createApp } from 'vue';
import App from './App.vue';
import { ServiceProviderRegistry } from './serviceProviders/ServiceProviderRegistry';

// IPC comms
const initIpc = () => {
  window.rendererToHub.receive('sendToRenderer', async (event, data) => {
    console.warn(`event "${event}" requires Ack, ensure it is handled`);
    localHub.trigger(event, data);
  });
  localHub.for('main', async (event, ...args) => {
    window.rendererToHub.send('sendToMain', event, ...args);
  });
}

// Initialise Vue
const app = createApp(App);

// Register all Service Providers
const ProviderRegistry = new ServiceProviderRegistry();

const debug = ProviderRegistry.debugLogger,
  localHub = ProviderRegistry.localHubProvider;

// Assign globals
Object.assign(app.config.globalProperties, {
  $localHub: ProviderRegistry.localHubProvider,
  $debugLogger: ProviderRegistry.debugLogger,
});

app.mount('#app');

initIpc();

localHub.trigger('main/coreLoadComplete');