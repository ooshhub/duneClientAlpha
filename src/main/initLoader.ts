import { Helpers } from '../shared/Helpers';
import { Helpers as NodeHelpers } from './NodeHelpers';
import { mainHub, mlog, electronRoot } from './main';

export const initConfig = async (configReference): Promise<boolean> => {
	const electronApp = electronRoot.app;
	const rootPath = electronApp?.getAppPath();
	const externalPath = electronApp.isPackaged ? electronApp.getPath('exe').replace(/\\[^\\]+$/, '') : rootPath;
	if (!rootPath) throw new Error(`initConfig error: no root path to Electron found.`);
	const config = {
		CORE: {			
			PACKAGED: electronApp.isPackaged
		},
		NET: {
			PUBLIC_IP: "",
		},
		PATH: {
			ROOT: rootPath,
			USERDATA: `${externalPath}/config`, // change to electron.app.getPath('userData') later
			SAVEGAME: `${externalPath}/saves`,
			HTML: `${rootPath}/client/templates`,
			HBS: `${rootPath}/client/templates/hbs`,
			CORE: `${rootPath}/server/core`,
			ASSETS: `${rootPath}/assets`
		},
	};
	Object.assign(configReference, config);
	if (configReference.PATH.ROOT) {
		const loadResult = await Helpers.parallelLoader([
			{ name: `playerSettings`, load: getUserSettings(configReference) },
			{ name: `netSettings`, load: getPublicIp(configReference) },
			{ name: `electronReady`, load: electronApp.whenReady() },
			{ name: 'mainHubInit', load: import('./mainHub') }
		]);
		if (loadResult.failures === 0) {
			mlog(loadResult.msgs.join('\n'));
			return true;
		} else {
			throw new Error(loadResult.errs.join('\n'));
		}
	}
	else throw new Error(`Could not initialise core CONFIG.`);
}

// Load user settings, or get defaults
const getUserSettings = async (configReference): Promise<Error | void> => {
	const settingsPath = `${configReference.PATH.USERDATA}/userSettings.json`;
  let err;
	try {
		let settings = await NodeHelpers.getFile(settingsPath, true);
		if ('player' !in settings) {
			settings = await NodeHelpers.getFile(`${configReference.PATH.USERDATA}/defaultUserSettings.json`, true);
			if (!settings) err = new Error(`Could not find default settings @${process.env.NODE_ENV} @@${configReference.PATH.TEMP}`);
			else await NodeHelpers.saveFile(settingsPath, JSON.stringify(settings));
		}
		else {
			if (!/^[A-Za-z]_/.test(`${settings.player.pid}`)) {
				settings.player.pid = Helpers.generatePlayerId(process?.env?.USERNAME ?? '');
				mlog(`New player ID generated: ${settings.player.id}`);
				mainHub.trigger('saveConfig', settings);
			}
			if ('playerName' !in settings.player) {
				settings.player.playerName = process.env?.USERNAME || `newPlayer_${Math.floor(Math.random()*999)}`;
			}
		}
		configReference.userSettings = settings;
	} catch(e) {
		err=e;
	}
	return err ?? true;
}

// Get public facing IP
const getPublicIp = async (configReference): Promise<void> => {
	return new Promise((res) => {
		fetch('api.ipify.org/').then((resp: Response) => {
      console.log(resp);
      configReference.NET.PUBLIC_IP = resp?.body?.toString() ?? '';
		}).catch(e => console.log(e))
    .finally(() => res());
  });
};