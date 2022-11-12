// Legacy: 
// main process event hub
import { mainHub, electronRoot, debug } from '../main';
import { DuneEvent } from '../shared/events/DuneEvent';
import { main } from './mainFunctions.js';

// First round of handlers
mainHub.on('requestHtml', main.renderHtml);
mainHub.on('requestConfig', main.getConfig);
mainHub.on('writeConfig', main.modifyConfig);

// Wait for main window to attach listeners
mainHub.once('mainWindowReady', ({ win }) => {
	// ipc passthrough for main <==> renderer messaging
	mainHub.for('renderer', (event, ...args) => {
    win.webContents.send('sendToRenderer', event, ...args);
  });
	electronRoot.ipcMain.on('receiveFromRenderer', async (_ipcEvent, event, ...args) => {
    console.log("received message from renderer");
    mainHub.trigger(new DuneEvent(event, args));
  });
	// save on quit
	electronRoot.app.on('before-quit', (ev) => { ev.preventDefault(); main.exitAndSave(); });
	// other events
	// mainHub.on('startServer', main.startServer);
	mainHub.on('killServer', main.killServer);
	mainHub.on('exitGame', main.exitAndSave);
	mainHub.on('inspectElement', main.inspectEl);
	mainHub.on('writeClipboard', (str) => main.ioClipboard(str||'no text'));
	mainHub.on('readClipboard', main.ioClipboard);
	mainHub.on('requestMentatHtml', main.renderMentatHtml);

	debug.log(`===mainHub handlers registered===`);
});