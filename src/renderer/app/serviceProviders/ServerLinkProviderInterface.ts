export type SocketConnectionConfig = {
  address: string,
  port: string|number,
  scheme: string,
}

export interface ServerLinkProviderInterface {

  connectToServer: (config: SocketConnectionConfig|null) => Promise<boolean>;

  sendToServer: (stuff: string) => Promise<void>;

  receiveFromServer: (...args: any[]) => Promise<void>;

  destroyConnection: () => Promise<void>;

}