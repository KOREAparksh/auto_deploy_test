import { app, ipcMain } from "electron";
import serve from "electron-serve";
import fs from "fs";
import path from "path";
import { createWindow } from "./helpers";

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
