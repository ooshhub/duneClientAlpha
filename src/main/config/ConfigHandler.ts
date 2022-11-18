// TODO: Temporary static functions - rewrite when replacing initLoader.ts
import * as electron from 'electron';
import { DebugLogger } from '../../shared/DebugLogger';
import { DuneEvent } from '../../shared/events/DuneEvent';
import { EventHub } from '../../shared/events/EventHub';
import { Helpers } from '../../shared/Helpers';
import { EVENTS, MainEventIndex } from '../events/MainEventIndex';
import { NodeHelpers } from "../NodeHelpers";

export class ConfigHandler {

	#config: genericJson;
	#hub: EventHub;
	#debug: DebugLogger;

	constructor(currentConfig: genericJson, debug: DebugLogger, eventHub: EventHub) {
		this.#config = currentConfig;
		this.#hub = eventHub;
		this.#debug = debug;
	}
	get debug() { return this.#debug }

	async #modifyConfig ({ path, data, options }) {
		if (!data || !path) return this.debug.log(`modifyConfig: no data received with request`, data);
		const target = Helpers.getObjectPath(this.#config, path, options?.createPath||true);
		this.debug.log([`Writing to config...`, target, data]);
		Object.assign(target, data);
		this.debug.log(this.#config.userSettings);
		if (!options.noSave) this.#saveConfig();
	}
	async #getConfig (duneEvent: DuneEvent) {
		const { id, domain } = duneEvent.reply ?? {};
		if (id && domain) this.#hub.trigger({ ...duneEvent, eventName: `${domain}/${id}`, eventData: this.#config });
		else this.#hub.trigger(new DuneEvent({ eventName: 'renderer/responseConfig', eventData: this.#config }));
	}

	async #saveConfig () {
		NodeHelpers.saveFile(`${this.#config.PATH.USERDATA}/userSettings.json`, JSON.stringify(this.#config.userSettings));
	}

	async #saveAndExit () {
		console.log(`Saving settings...`);
		NodeHelpers.timeout(50);
		await this.#saveConfig()
			.catch((err: Error) => {
				electron.app.exit();
				throw err;
			});
		electron.app.exit();
	}

	registerHandlers() {
		MainEventIndex.registerEvents(EVENTS.CONFIG.REQUEST, this.#getConfig.bind(this));
		MainEventIndex.registerEvents(EVENTS.CONFIG.WRITE, this.#modifyConfig);
		MainEventIndex.registerEvents(EVENTS.SYSTEM.EXIT, this.#saveAndExit);
	}

}