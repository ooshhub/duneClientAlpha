import type { BrowserWindow } from 'electron';

declare global {

  type ElectronBrowserWindow = BrowserWindow;

  type genericJson = {
    [key: string]: any
  }

  type anyClass = new (...args: any[]) => any;

}

export default global;