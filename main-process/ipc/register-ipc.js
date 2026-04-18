import { ipcMain } from "electron";

export function registerIpc({ engine, getAppWindow, getPetController, onState, onPetFocusAction }) {
  function broadcast(state) {
    const appWindow = getAppWindow?.();
    if (appWindow && !appWindow.isDestroyed()) {
      appWindow.webContents.send("state:update", state);
    }
    const petWindow = getPetController?.()?.window;
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send("state:update", state);
    }
  }

  engine.on("state", (state) => {
    broadcast(state);
    onState?.(state);
  });

  ipcMain.handle("demo:get-state", () => engine.snapshot());
  ipcMain.handle("auth:register", (_event, payload) => engine.register(payload));
  ipcMain.handle("auth:login", (_event, payload) => engine.login(payload));
  ipcMain.handle("auth:logout", () => engine.logout());
  ipcMain.handle("demo:connect", () => engine.connectDemo());
  ipcMain.handle("demo:rerun", () => engine.rerunPipeline());
  ipcMain.handle("demo:trigger", (_event, triggerId) => engine.triggerScenario(triggerId));
  ipcMain.handle("demo:set-page", (_event, page) => engine.setPage(page));
  ipcMain.handle("demo:select-video", (_event, videoId) => engine.selectVideo(videoId));
  ipcMain.handle("demo:toggle-step", (_event, index) => engine.toggleChecklistStep(index));
  ipcMain.handle("demo:chat", (_event, question) => engine.sendChat(question));
  ipcMain.handle("demo:new-chat", () => engine.newConversation());
  ipcMain.handle("demo:select-chat", (_event, conversationId) => engine.selectConversation(conversationId));
  ipcMain.handle("demo:toggle-setting", (_event, key) => engine.toggleSetting(key));
  ipcMain.handle("demo:set-companion-preference", (_event, key, value) => engine.setCompanionPreference(key, value));
  ipcMain.handle("demo:pet-action", (_event, action) => engine.handlePetAction(action));
  ipcMain.handle("pet:focus-action", async () => {
    await onPetFocusAction?.();
    return engine.snapshot();
  });
  ipcMain.handle("pet:reposition", () => {
    getPetController?.()?.reposition();
    return true;
  });
  ipcMain.on("pet:drag-start", (_event, pointer) => {
    getPetController?.()?.startDrag(pointer);
  });
  ipcMain.on("pet:drag-move", (_event, pointer) => {
    getPetController?.()?.drag(pointer);
  });
  ipcMain.on("pet:drag-end", (_event, pointer) => {
    getPetController?.()?.endDrag(pointer);
  });
}
