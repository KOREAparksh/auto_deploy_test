import { app, BrowserWindow, ipcMain } from "electron";
import serve from "electron-serve";
import { autoUpdater } from "electron-updater";
import fs from "fs";
import path from "path";
import { createWindow } from "./helpers";

// 앱이 두 번째 인스턴스로 실행되는지 확인 (업데이트 후 재시작)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 두 번째 인스턴스면 종료
  console.log("다른 인스턴스가 이미 실행 중입니다. 이 인스턴스를 종료합니다.");
  app.quit();
} else {
  // 두 번째 인스턴스가 시작되면 첫 번째 인스턴스의 창을 포커스
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("두 번째 인스턴스가 시작되었습니다. 첫 번째 인스턴스의 창에 포커스합니다.");
    console.log("command line arguments:", commandLine);

    // 메인 윈도우가 생성된 경우
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // 자동 업데이트 로깅 활성화
  autoUpdater.logger = console;
  // 자동 다운로드 활성화 - 앱 시작 시 업데이트가 있으면 자동으로 다운로드
  autoUpdater.autoDownload = true;
  // 앱 종료 시 자동 설치 활성화
  autoUpdater.autoInstallOnAppQuit = true;
  // 업데이트 설치 후 자동으로 앱 실행
  autoUpdater.autoRunAppAfterInstall = true;
}

// 자동 업데이트 추가 설정
autoUpdater.allowDowngrade = false; // 다운그레이드 방지
autoUpdater.allowPrerelease = false; // 프리릴리즈 방지
autoUpdater.forceDevUpdateConfig = false; // 개발 모드에서도 업데이트 설정 강제 적용 안 함

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
    console.log("업데이트 확인 중...");
    mainWindow.webContents.send("update-status", { status: "checking" });
  });

  // 업데이트 사용 가능
  autoUpdater.on("update-available", (info) => {
    console.log(`새 버전 발견: ${info.version}`);
    mainWindow.webContents.send("update-status", {
      status: "available",
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  // 업데이트 없음
  autoUpdater.on("update-not-available", () => {
    console.log("사용 가능한 업데이트 없음");
    mainWindow.webContents.send("update-status", { status: "not-available" });
  });

  // 다운로드 진행 상황
  autoUpdater.on("download-progress", (progressObj) => {
    const logMessage = `다운로드 속도: ${progressObj.bytesPerSecond} - 진행률: ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);

    mainWindow.webContents.send("update-status", {
      status: "downloading",
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  // 다운로드 완료
  autoUpdater.on("update-downloaded", (info) => {
    console.log(`업데이트 다운로드 완료: ${info.version}`);
    mainWindow.webContents.send("update-status", {
      status: "downloaded",
      version: info.version,
      releaseNotes: info.releaseNotes,
    });

    // 업데이트가 준비되었음을 사용자에게 알림
    mainWindow.webContents.send("update-ready", {
      version: info.version,
      notes: info.releaseNotes,
    });

    // 5초 후 자동으로 업데이트 설치 및 앱 재시작
    console.log("5초 후 자동 업데이트 설치...");
    setTimeout(() => {
      // 앱 실행 경로 저장 (재시작을 위해)
      const appPath = process.execPath;
      const appArgs = process.argv.slice(1).filter((arg) => !arg.startsWith("--squirrel"));

      console.log("업데이트 설치 및 앱 재시작...");
      console.log(`앱 경로: ${appPath}`);
      console.log(`앱 인자: ${appArgs.join(" ")}`);

      // 자동으로 설치 및 재시작
      // 첫 번째 매개변수: isSilent - 사용자에게 알림 없이 자동 업데이트
      // 두 번째 매개변수: isForceRunAfter - 업데이트 후 앱 자동 재시작
      autoUpdater.quitAndInstall(true, true);
    }, 5000);
  });

  // 오류 발생
  autoUpdater.on("error", (err) => {
    console.error("업데이트 오류:", err);
    mainWindow.webContents.send("update-status", {
      status: "error",
      error: err.toString(),
    });
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

    // 앱 시작 시에만 업데이트 확인 (앱이 완전히 로드된 후)
    setTimeout(() => {
      console.log("앱 시작 후 업데이트 확인...");
      autoUpdater.checkForUpdates();
    }, 5000);
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
