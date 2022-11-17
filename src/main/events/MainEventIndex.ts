import { EventIndex } from "../../shared/events/EventIndex";

export class MainEventIndex extends EventIndex { }

export const EVENTS = {
	CONFIG: {
		REQUEST:	'requestConfig',
		WRITE:		'writeConfig',
	},
	SYSTEM: {
		EXIT: 		'exitGame',
	},
	CLIPBOARD: {
		READ:			'readClipboard',
		WRITE:		'writeClipboard',
	},
	HTML: {
		REQUEST:	'requestHtml',
		INSPECT:	'inspectElement',
	},
	SERVER: {
		KILL:			'killServer',
	},
	MENTAT: {
		REQUEST:	'requestMentatHtml',
	}
}