import { ipcMain } from "electron";

export function registerIpc({ engine, appWindow, petController }) {
  function broadcast(state) {
    if (appWindow && !appWindow.isDestroyed()) {
      appWindow.webContents.send("state:update", state);
    }
    const petWindow = petController?.window;
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send("state:update", state);
    }
  }

  engine.on("state", (state) => {
    broadcast(state);
    if (state.pet.lastTriggerId && state.settings.animationEnabled) {
      petController?.animateFromOrigin({ x: 36, y: 280 });
    } else {
      petController?.dock();
    }
  });

  ipcMain.handle("demo:get-state", () => engine.snapshot());
  ipcMain.handle("demo:connect", () => engine.connectDemo());
  ipcMain.handle("demo:rerun", () => engine.rerunPipeline());
  ipcMain.handle("demo:trigger", (_event, triggerId) => engine.triggerScenario(triggerId));
  ipcMain.handle("demo:set-page", (_event, page) => engine.setPage(page));
  ipcMain.handle("demo:select-video", (_event, videoId) => engine.selectVideo(videoId));
  ipcMain.handle("demo:toggle-step", (_event, index) => engine.toggleChecklistStep(index));
  ipcMain.handle("demo:chat", (_event, question) => engine.sendChat(question));
  ipcMain.handle("demo:toggle-setting", (_event, key) => engine.toggleSetting(key));
  ipcMain.handle("demo:pet-action", (_event, action) => engine.handlePetAction(action));
}
