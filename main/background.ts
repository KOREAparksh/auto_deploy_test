import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { autoUpdater } from "electron-updater";
import fs from "fs";
import path from "path";
import { createWindow } from "./helpers";

// 자동 업데이트 로깅 활성화
autoUpdater.logger = console;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

// package.json에서 버전 정보 가져오기
let appVersion = "1.0.0";
try {
  const packageJsonPath = path.join(app.getAppPath(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  appVersion = packageJson.version;
} catch (error) {
  console.error("package.json 읽기 실패:", error);
}

// 업데이트 이벤트 리스너 설정
function setupAutoUpdater(mainWindow) {
  // 업데이트 확인 중
  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send("update-status", { status: "checking" });
  });

  // 업데이트 사용 가능
  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update-status", {
      status: "available",
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  // 업데이트 없음
  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update-status", { status: "not-available" });
  });

  // 오류 발생
  autoUpdater.on("error", (err) => {
    mainWindow.webContents.send("update-status", {
      status: "error",
      error: err.toString(),
    });
  });

  // 다운로드 진행 상황
  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow.webContents.send("update-status", {
      status: "downloading",
      percent: progressObj.percent,
    });
  });

  // 다운로드 완료
  autoUpdater.on("update-downloaded", (info) => {
    mainWindow.webContents.send("update-status", {
      status: "downloaded",
      version: info.version,
      releaseNotes: info.releaseNotes,
    });

    // 자동으로 업데이트 설치 및 재시작 (선택적)
    autoUpdater.quitAndInstall(false, true);
  });
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");

    // 프로덕션 모드에서만 업데이트 설정
    setupAutoUpdater(mainWindow);

    // 애플리케이션이 시작될 때 업데이트 체크
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  // 앱 버전 정보를 renderer에 전달하기 위해 ready-to-show 이벤트 사용
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("app-version", appVersion);
  });
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("get-app-version", (event) => {
  event.reply("app-version", appVersion);
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});

// 업데이트 수동 체크 기능 추가
ipcMain.on("check-for-updates", () => {
  autoUpdater.checkForUpdatesAndNotify();
});
