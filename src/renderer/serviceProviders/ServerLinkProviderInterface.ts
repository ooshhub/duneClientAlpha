import { DuneEvent } from "../../shared/events/DuneEvent";
import { SocketConfigObject } from "../net/SocketIoClientProvider";
import { EventRoutingInterface } from "../../shared/events/EventRoutingInterface";

export interface ServerLinkProviderInterface {

  connectToServer: (config: SocketConfigObject) => Promise<boolean>;

  sendToServer: (event: DuneEvent) => Promise<void>;

  receiveFromServer: (...args: any[]) => Promise<void>;

  destroyConnection: () => Promise<void>;

  registerEventRouter: (eventRouter: EventRoutingInterface) => void;

}