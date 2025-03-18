import { IpcHandler } from "../main/preload";

declare global {
  interface Window {
    ipc: IpcHandler;
    electron: {
      getAppVersion: () => Promise<string>;
    };
  }
}
