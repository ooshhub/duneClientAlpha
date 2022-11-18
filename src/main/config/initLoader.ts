import { Helpers } from '../../shared/Helpers';
import { NodeHelpers } from '../NodeHelpers';
import * as http from 'http';
import * as electron from 'electron';
import { DuneEvent } from '../../shared/events/DuneEvent';
import { LocalHubServiceInterface } from '../../shared/events/LocalHubProviderInterface';

export const initConfig = async (configReference, mainHub: LocalHubServiceInterface): Promise<boolean> => {

	const electronApp = electron.app;
	const rootPath = import.meta.url.replace(/\/main\/[^/]+$/, '').replace(/^[^:]+:\/\/\//, '');
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
			{ name: `playerSettings`, load: getUserSettings(configReference, mainHub) },
			{ name: `netSettings`, load: getPublicIp(configReference) },
			{ name: `electronReady`, load: electronApp.whenReady() },
		]);
		if (loadResult.failures === 0) {
			console.log(loadResult.msgs.join('\n'));
			return true;
		} else {
			throw new Error(loadResult.errs.join('\n'));
		}
	}
	else throw new Error(`Could not initialise core CONFIG.`);
}

// Load user settings, or get defaults
const getUserSettings = async (configReference: genericJson, mainHub: LocalHubServiceInterface): Promise<Error | void> => {
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
				console.log(`New player ID generated: ${settings.player.id}`);
				mainHub.trigger(new DuneEvent({ eventName: 'saveConfig', eventData: settings }));
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
		http.get('http://api.ipify.org/', {}, (response) => {
      const { statusCode } = response;
      if (statusCode && statusCode > 199 && statusCode < 300) {
        response.on('data', ip => {
          configReference.NET.PUBLIC_IP = ip.toString();
          res();
        });
      }
      else configReference.NET.PUBLIC_IP = '';
			})
      .on('error', e => { console.error(e.message) });
  });
};