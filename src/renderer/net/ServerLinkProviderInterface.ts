import { DuneEvent } from "../../shared/events/DuneEvent";
import { SocketConfigObject } from "./SocketIoClientProvider";
import { EventRoutingInterface } from "../../shared/serviceProviders/EventRoutingInterface";

export interface ServerLinkProviderInterface {

  connectToServer: (config: SocketConfigObject) => Promise<boolean>;

  sendToServer: (event: DuneEvent) => Promise<void>;

  receiveFromServer: (...args: any[]) => Promise<void>;

  destroyConnection: () => Promise<void>;

  registerEventRouter: (eventRouter: EventRoutingInterface) => void;

}