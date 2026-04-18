import path from "node:path";
import { BrowserWindow } from "electron";

export function createAppWindow() {
  const win = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1180,
    minHeight: 780,
    title: "EGoclaw",
    backgroundColor: "#f6f5f1",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(process.cwd(), "desktop-app/preload/app-preload.js"),
      contextIsolation: true,
      sandbox: false
    }
  });

  win.loadFile(path.join(process.cwd(), "desktop-app/index.html"));
  return win;
}
