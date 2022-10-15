import type { BrowserWindow } from 'electron';

declare global {

  type ElectronBrowserWindow = BrowserWindow;

  type genericJson = {
    [key: string]: any
  }

  type anyClass<T = any> = new (...args: any[]) => T;

}

export default global;