import { createApp } from 'vue';
import { DuneEvent } from '../../shared/Events/DuneEvent';
import { IpcEvent } from '../../shared/Events/IpcEvent';
import App from './App.vue';
import { ServiceProviderRegistry } from './serviceProviders/ServiceProviderRegistry';

// IPC comms
const initIpc = () => {
  window.rendererToHub.receive('sendToRenderer', async ({eventName, eventData}: IpcEvent) => {
    // console.warn(`event "${eventName}" requires Ack, ensure it is handled`);
    localHub.trigger(new DuneEvent(eventName, eventData));
  });
  localHub.for('main', async ({ eventName, eventData }: DuneEvent) => {
    window.rendererToHub.send('sendToMain', new IpcEvent(eventName, eventData));
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

localHub.trigger(new DuneEvent('main/coreLoadComplete'));