// Renderer specific types

import type { BrowserWindow } from 'electron';

declare global {

  type ElectronBrowserWindow = BrowserWindow;

  interface Window {
    rendererToHub: any;
    Dune: any;
  }
}
