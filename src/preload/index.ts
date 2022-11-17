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
    send: async (channel, event, ...args) => {
      if (channels.send.includes(channel)) ipcRenderer.send('sendToMain', event, ...args);
      else console.warn(`Message from renderer was rejected: "${channel}" is not a valid token`);
    },
    receive: async (channel, evHandler) => {
      if (channels.receive.includes(channel)) ipcRenderer.on(channel, (_ipcEvent, event, ...args) => {
        evHandler(event, ...args);
      });
      else console.warn(`Message from main process was rejected: "${channel}" is not a valid token`);
    }
  });
  // contextBridge.exposeInMainWorld('electron', electronAPI);
}
else {
  // window.electron = electronAPI
}