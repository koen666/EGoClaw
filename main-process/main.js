import { app } from "electron";
import { DemoEngine } from "../shared/store/demo-engine.js";
import { createAppWindow } from "./windows/app-window.js";
import { createPetWindow } from "./windows/pet-window.js";
import { registerIpc } from "./ipc/register-ipc.js";
import { createDouyinDetector } from "./system/douyin-detector.js";

let engine = null;
let appWindow = null;
let petController = null;
let detector = null;
let isDouyinForeground = false;
let ipcRegistered = false;

function getAppWindow() {
  if (!appWindow || appWindow.isDestroyed()) {
    return null;
  }
  return appWindow;
}

function ensureAppWindow() {
  const win = getAppWindow();
  if (win) return win;
  appWindow = createAppWindow();
  return appWindow;
}

function getPetController() {
  if (!petController || petController.window.isDestroyed()) {
    return null;
  }
  return petController;
}

function ensurePetController() {
  const controller = getPetController();
  if (controller) return controller;
  petController = createPetWindow();
  return petController;
}

function syncPetVisibility(snapshot = engine?.snapshot()) {
  if (!snapshot) return;
  const controller = getPetController();
  if (!controller) return;
  controller.syncVisibility(Boolean(snapshot.pet.visible && isDouyinForeground));
}

async function focusCurrentActionFromPet() {
  if (!engine) return;
  await engine.handlePetAction("start");
  const win = ensureAppWindow();
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
}

async function bootstrap() {
  if (!engine) {
    engine = new DemoEngine();
  }
  ensureAppWindow();
  ensurePetController();

  if (!ipcRegistered) {
    registerIpc({
      engine,
      getAppWindow,
      getPetController,
      onState: syncPetVisibility,
      onPetFocusAction: focusCurrentActionFromPet
    });
    ipcRegistered = true;
  }

  if (!detector) {
    detector = createDouyinDetector({
      onOpen: async () => {
        if (!engine.snapshot().settings.autoNudge) return;
        await engine.triggerScenario("douyin_open");
      },
      onStateChange: (isOpen) => {
        isDouyinForeground = isOpen;
        syncPetVisibility();
      }
    });

    detector.start(3000);
  }

  syncPetVisibility();
}

app.whenReady().then(bootstrap);

app.on("activate", () => {
  bootstrap();
  const win = ensureAppWindow();
  if (!win.isVisible()) {
    win.show();
  }
  win.focus();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  detector?.stop();
});
