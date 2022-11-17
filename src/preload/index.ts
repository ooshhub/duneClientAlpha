import * as electron from 'electron';
// import { electronAPI } from '@electron-toolkit/preload';

const { contextBridge, ipcRenderer } = electron;

const channels = {
  send: ['sendToMain'],
  receive: ['sendToRenderer']
};
// Context bridge for messaging: Main process <==> Renderer 
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('rendererToHub', {
    send: async (channel: string, eventName: string, eventData: genericJson) => {
      if (channels.send.includes(channel)) ipcRenderer.send('sendToMain', eventName, eventData);
      else console.warn(`Message from renderer was rejected: "${channel}" is not a valid token`);
    },
    on: async (channel: string, evHandler: (...args: any[]) => void) => {
			console.log('FUKN RECCCCCD');
      if (channels.receive.includes(channel)) ipcRenderer.on(channel, (_ipcEvent, eventName, eventData) => {
        evHandler(_ipcEvent, eventName, eventData);
      });
      else console.warn(`Message from main process was rejected: "${channel}" is not a valid token`);
    }
  });
  // contextBridge.exposeInMainWorld('electron', electronAPI);
}
else {
  // window.electron = electronAPI
}