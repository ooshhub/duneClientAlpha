import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown,
    rendererToHub: {
      send: (channel: string, eventObject: IpcEvent) => void,
      receive: (channel: string, eventObject: IpcEvent) => void,
    }
  }
}
