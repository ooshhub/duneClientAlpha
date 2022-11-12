import { EventHub } from "../events/EventHub";

type HandlerList = {
  [name: string]: any,
}

export class RouteIndex {

  #eventHub: EventHub;

  #handlers = {};
  #groups = { __: {} };

  name = 'routeIndex';

  constructor(name: string, eventHub: EventHub, handlerList: HandlerList) {
    this.name = name;
    this.#eventHub = eventHub;
    for (const key in handlerList) {
      this.#handlers[key] = handlerList[key];
    }
  }

  /**
   * Add a route group to the route handler. Double underscore __ is a reserved name for root-level routes.
   * 
   * @param groupName 
   */
  #addGroup(groupName) {
    if (!this.#groups[groupName]) this.#groups[groupName] = {};
  }

  #addRoute(routeName, functionName) {

  }

  #handleError() {}

  #dispatchEvent() {}

  receiveEvent() {}

  group(callbackWithRouteRegistrations) {

  }

  route() {}

  }


}