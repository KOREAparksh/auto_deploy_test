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
  // 수동 업데이트 설치 요청 (옵션)
  installUpdate: () => {
    ipcRenderer.send("install-update");
  },
  // 업데이트 상태 이벤트 수신
  onUpdateStatus: (callback: (status: any) => void) => {
    const subscription = (_event: IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on("update-status", subscription);

    return () => {
      ipcRenderer.removeListener("update-status", subscription);
    };
  },
  // 업데이트 준비 알림 수신
  onUpdateReady: (callback: (info: any) => void) => {
    const subscription = (_event: IpcRendererEvent, info: any) => callback(info);
    ipcRenderer.on("update-ready", subscription);

    return () => {
      ipcRenderer.removeListener("update-ready", subscription);
    };
  },
});

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
