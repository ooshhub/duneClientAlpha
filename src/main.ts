// Legacy:
import * as electron from 'electron';
import { Helpers } from './shared/Helpers';
import { EventHub } from './shared/Events/EventHub';
import { DebugLogger } from './shared/DebugLogger';
import { initConfig } from './main/initLoader';
import { DuneEvent } from './shared/Events/DuneEvent';

export const CONFIG: genericJson = { DEBUG: 1 };
export const mainHub = new EventHub('main');
export const debug = new DebugLogger('main', mainHub, true, true);
export const electronRoot = electron;
export const Win: genericJson = {};

debug.log(`===Dependencies Loaded===`);

// Call initLoader
(async (): Promise<void> => {
	initConfig(CONFIG).then(() => {
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

	// const loadingFrame = await createWindow({
	// 	browserWindow: {
	// 		width: 768,
	// 		height: 432,
	// 		resizable: true,
	// 		skipTaskbar: true,
	// 		frame: false,
	// 		titleBarVisible: false,
	// 	},
	// 	html: `${CONFIG.PATH.HTML}/splash.html`
	// });

	// loadingFrame.once('ready-to-show', async () => {
	// 	await Helpers.timeout(100);
	// 	loadingFrame.show();
	// 	Helpers.windowFade(loadingFrame, 500);
	// });
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
  if (!CONFIG.CORE.isPackaged && process.env['ELECTRON_RENDERER_URL']) mainFrame.loadURL(process.env['ELECTRON_RENDERER_URL']);
  else mainFrame.loadFile(`${CONFIG.PATH.ROOT}/renderer/index.html`);
  
	Win.Main = mainFrame;
	mainHub.trigger(new DuneEvent('mainWindowReady', { win: mainFrame }));

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
}