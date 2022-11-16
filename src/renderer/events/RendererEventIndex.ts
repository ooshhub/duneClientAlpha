import { EventIndex } from "../../shared/events/EventIndex";

export class RendererEventIndex extends EventIndex { }

export const EVENTS = {
  DEBUGGER: {
    PROCESSLOG: [
      'rendererLog',
      'socketLog',
      'serverLog',
      'mainLog'
    ],
  }
}