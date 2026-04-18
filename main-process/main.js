import { app } from "electron";
import { DemoEngine } from "../shared/store/demo-engine.js";
import { createAppWindow } from "./windows/app-window.js";
import { createPetWindow } from "./windows/pet-window.js";
import { registerIpc } from "./ipc/register-ipc.js";
import { createDouyinDetector } from "./system/douyin-detector.js";

let appWindow = null;
let petController = null;
let detector = null;

async function bootstrap() {
  const engine = new DemoEngine();
  appWindow = createAppWindow();
  petController = createPetWindow();

  registerIpc({
    engine,
    appWindow,
    petController
  });

  detector = createDouyinDetector({
    onOpen: async () => {
      if (!engine.snapshot().settings.autoNudge) return;
      await engine.triggerScenario("douyin_open");
    }
  });

  detector.start(3000);
}

app.whenReady().then(bootstrap);

app.on("activate", () => {
  if (appWindow?.isDestroyed()) {
    bootstrap();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  detector?.stop();
});
