import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { autoUpdater } from "electron-updater";
import fs from "fs";
import path from "path";
import { createWindow } from "./helpers";

// 자동 업데이트 로깅 활성화
autoUpdater.logger = console;
autoUpdater.autoDownload = true;
// 앱 종료 시 자동 설치 비활성화 - 대신 즉시 설치하도록 변경
autoUpdater.autoInstallOnAppQuit = false;

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

  // 오류 발생
  autoUpdater.on("error", (err) => {
    console.error("업데이트 오류:", err);
    mainWindow.webContents.send("update-status", {
      status: "error",
      error: err.toString(),
    });
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

    // 작은 알림 표시 - 사용자에게 업데이트 알림
    mainWindow.webContents.send("update-ready", {
      version: info.version,
      notes: info.releaseNotes,
    });

    // 타이머 시작 - 3초 후 자동 업데이트 설치
    console.log("3초 후 자동 업데이트 설치...");
    setTimeout(() => {
      // 자동으로 설치 및 재시작
      // 첫 번째 매개변수: isSilent - 사용자에게 알림 없이 자동 업데이트
      // 두 번째 매개변수: isForceRunAfter - 업데이트 후 앱 자동 재시작
      console.log("업데이트 설치 및 앱 재시작...");
      autoUpdater.quitAndInstall(true, true);
    }, 3000);
  });
}

// 정기적인 업데이트 확인 설정
function setupPeriodicUpdates() {
  // 1분마다 업데이트 확인
  const ONE_MINUTE = 60 * 1000;
  setInterval(() => {
    console.log("정기 업데이트 확인 중...");
    autoUpdater.checkForUpdates();
  }, ONE_MINUTE);
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

    // 정기적인 업데이트 확인 설정
    setupPeriodicUpdates();

    // 앱 시작 5초 후 업데이트 확인 (앱이 완전히 로드된 후)
    setTimeout(() => {
      console.log("앱 시작 후 첫 업데이트 확인...");
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

// 업데이트 수동 체크 기능 추가
ipcMain.on("check-for-updates", () => {
  console.log("수동 업데이트 확인 요청...");
  autoUpdater.checkForUpdates();
});

// 업데이트 수동 설치 기능 추가 (옵션)
ipcMain.on("install-update", () => {
  console.log("수동 업데이트 설치 요청...");
  autoUpdater.quitAndInstall(true, true);
});
