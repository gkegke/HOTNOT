import { contextBridge, ipcRenderer } from 'electron';

export type Channels =
  | 'getStoreValue'
  | 'setStoreValue'
  | 'openFileBrowser'
  | 'openDirectory'
  | 'getRecentPaths'
  | 'getDirFilepaths'
  | 'moveFileToDir';

const electronHandler = {
  eAPI: {
    getStoreValue: (key: string) => ipcRenderer.invoke('getStoreValue', key),
    setStoreValue: (key: string, value: string) =>
      ipcRenderer.invoke('setStoreValue', key, value),
    openFileBrowser: () => ipcRenderer.invoke('openFileBrowser'),
    openDirectory: (dpath: string) =>
      ipcRenderer.invoke('openDirectory', dpath),
    getRecentPaths: () => ipcRenderer.invoke('getRecentPaths'),
    getDirFilepaths: (path: string) =>
      ipcRenderer.invoke('getDirFilepaths', path),
    moveFileToDir: (path: string, dir: string, actionType: string) =>
      ipcRenderer.invoke('moveFileToDir', path, dir, actionType),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
