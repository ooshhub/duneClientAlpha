// Legacy:
import * as electron from 'electron';
import { Helpers } from './shared/Helpers';
import { EventHub } from './shared/events/EventHub';
import { DebugLogger } from './shared/DebugLogger';
import { initConfig } from './main/config/initLoader';
import { DuneEvent } from './shared/events/DuneEvent';
import { EVENTS, MainEventIndex } from './main/events/MainEventIndex';
import { IpcMessagingService } from './shared/events/IpcMessagingService';
import { MainEventRouting } from './main/events/MainEventRouting';

export const CONFIG: genericJson = { DEBUG: 1 }; // This will be handed off to ConfigHandler when rewriting initHandler
const mainHub = new EventHub('mainHub');
MainEventIndex.eventHub = mainHub;
const debug = new DebugLogger('main', mainHub, true, true);

// TODO: Set up MainEventRouting and MainEventIndex, then remove mainFunctions and mainHub

debug.log(`===Dependencies Loaded===`);

// Call initLoader
(async (): Promise<void> => {
	initConfig(CONFIG, mainHub).then(() => {
    debug.log(`===Initialised settings===`);
      startElectron!();
    }).catch((e) => {
      console.error(e);
      electron.app.exit();
      throw e;
    });
})();

const startElectron = async (): Promise<void> => {
	debug.log(`Starting Electron...`);
	electron.nativeTheme.themeSource = 'dark';
	electron.app.setName(process.env.npm_package_productName||'Dune Prototype');
	const currentVersion = process.env.npm_package_version;
	const screen = electron.screen.getPrimaryDisplay().size;

	const createWindow = async (data: genericJson): Promise<electron.BrowserWindow> => {
		const winDefaults = {
			title: `${electron.app.name} - v${currentVersion}`,
			backgroundColor: '#201900',
			icon: electron.app.isPackaged ? `${CONFIG.PATH.ROOT}/assets/icons/iconAlpha.ico` : `${CONFIG.PATH.ROOT}/assets/icons/iconAlphaRed.ico`,
			menuBarVisible: false,
			show: false,
			opacity: 0.0,
		};
		if (data.browserWindow) Object.assign(winDefaults, data.browserWindow);
		const win: electron.BrowserWindow = new electron.BrowserWindow(winDefaults);
		if (data.dev) win.webContents.openDevTools();
		if (data.maximize) win.maximize();
		if (data.html) win.loadFile(data.html);
		return win;
	}

	// Instantiate the main Window
	const mainFrame = await createWindow({
		browserWindow: {
			width: screen.height * (16/9),
			height: screen.height,
			resizable: true,
			titleBarOverlay: {
        color: '#201900',
        symbolColor: '#74b1be'
      },
			webPreferences: {
				preload: `${CONFIG.PATH.ROOT}/preload/index.js`,
				devTools: true
			},
		},
		// html: `${CONFIG.PATH.ROOT}/renderer/index.html`,
		dev: true,
		maximize: false
	});

	// Load IPC service and Event Routing
	const ipcMessageService = new IpcMessagingService(
		'mainIpcService', 
		{ interface: mainFrame.webContents, channelName: 'sendToRenderer' }, 
		{ interface: electron.ipcMain, channelName: 'sendToMain' }
	);
	const eventRouting = new MainEventRouting(ipcMessageService, mainHub);
	mainHub.on('coreLoadComplete', () => {
		console.log('CORE LOAD COMPLETE');
		debug.info('core load compelte');
	});

	// Punch Vue into the main Window
	if (!CONFIG.CORE.isPackaged && process.env['ELECTRON_RENDERER_URL']) mainFrame.loadURL(process.env['ELECTRON_RENDERER_URL']);
  else mainFrame.loadFile(`${CONFIG.PATH.ROOT}/renderer/index.html`);

	mainHub.trigger(new DuneEvent('mainWindowReady', { win: mainFrame }));
	// Something happens here???

	let coreLoad = false;
	mainHub.once('coreLoadComplete', () => coreLoad = true);

	mainFrame.once('ready-to-show', async () => {
		await Helpers.watchCondition(() => coreLoad, '', 0).then(async (res) => {
			if (res) {
				mainFrame.show();
				mainFrame.focus();
				await Helpers.windowFade(mainFrame, 1000);
				// loadingFrame.destroy();
			} else {
				throw new Error('Core load failed.');
			}
		}).catch(e => {
			// Try to bring up main window on error
			console.error(e);
			// if (!mainFrame.isVisible()) {
				mainFrame.show();
				mainFrame.setOpacity(1.0);
				mainHub.trigger(new DuneEvent('renderer/fadeElement', ['main#mainmenu', 'in', 500]));
				// loadingFrame.destroy();
			// }
		});
	});


	// TODO: These can go somewhere later
	const inspectEl = async ({ x,y }) => {
    if (!mainFrame || !parseInt(x) || !parseInt(y)) {
      mainFrame.webContents.inspectElement(x,y);
    } else debug.log(`Couldn't find main window or bad pos data: (${x}, ${y})`);
  }

	const ioClipboard = async (inputString) => {
    if (inputString) 	electron.clipboard.writeText(`${inputString}`);
    else {
      let content = await electron.clipboard.readText();
      content = content ?? 'no text';
      mainHub.trigger(new DuneEvent('renderer/responseClipboard', { value: content }));
    }
  }
	MainEventIndex.registerEvents(EVENTS.HTML.INSPECT, inspectEl);
	MainEventIndex.registerEvents([ EVENTS.CLIPBOARD.READ, EVENTS.CLIPBOARD.WRITE ], ioClipboard);

}