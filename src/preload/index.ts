import * as electron from 'electron';
import { DuneEvent } from '../shared/events/DuneEvent';
// import { electronAPI } from '@electron-toolkit/preload';

const { contextBridge, ipcRenderer } = electron;

const channels = {
  send: ['sendToMain'],
  receive: ['sendToRenderer']
};
// Context bridge for messaging: Main process <==> Renderer 
contextBridge.exposeInMainWorld('rendererToHub', {
	send: async (channel: string, duneEvent: DuneEvent) => {
		if (channels.send.includes(channel)) ipcRenderer.send('sendToMain', duneEvent);
		else console.warn(`Message from renderer was rejected: "${channel}" is not a valid token`);
	},
	on: async (channel: string, evHandler: (...args: any[]) => void) => {
		if (channels.receive.includes(channel)) ipcRenderer.on(channel, (_ipcEvent, ipcData: DuneEvent) => {
			evHandler(_ipcEvent, new DuneEvent({ ...ipcData }));
		});
		else console.warn(`Message from main process was rejected: "${channel}" is not a valid token`);
	}
});
