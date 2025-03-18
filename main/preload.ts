import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

// 앱 정보 노출하기
contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => {
    return new Promise((resolve) => {
      ipcRenderer.once("app-version", (_event, version) => {
        resolve(version);
      });
      ipcRenderer.send("get-app-version");
    });
  },
  checkForUpdates: () => {
    ipcRenderer.send("check-for-updates");
  },
  onUpdateStatus: (callback: (status: any) => void) => {
    const subscription = (_event: IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on("update-status", subscription);

    return () => {
      ipcRenderer.removeListener("update-status", subscription);
    };
  },
});

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
