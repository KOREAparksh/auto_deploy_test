import { IpcHandler } from "../main/preload";

declare global {
  interface Window {
    ipc: IpcHandler;
    electron: {
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => void;
      installUpdate: () => void;
      onUpdateStatus: (callback: (status: any) => void) => () => void;
      onUpdateReady: (callback: (info: any) => void) => () => void;
    };
  }
}
