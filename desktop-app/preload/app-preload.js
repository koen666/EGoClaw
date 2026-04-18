import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("egoclawApp", {
  getState: () => ipcRenderer.invoke("demo:get-state"),
  connectDemo: () => ipcRenderer.invoke("demo:connect"),
  rerunPipeline: () => ipcRenderer.invoke("demo:rerun"),
  simulateTrigger: (triggerId) => ipcRenderer.invoke("demo:trigger", triggerId),
  setPage: (page) => ipcRenderer.invoke("demo:set-page", page),
  selectVideo: (videoId) => ipcRenderer.invoke("demo:select-video", videoId),
  toggleChecklistStep: (index) => ipcRenderer.invoke("demo:toggle-step", index),
  sendChat: (question) => ipcRenderer.invoke("demo:chat", question),
  toggleSetting: (key) => ipcRenderer.invoke("demo:toggle-setting", key),
  petAction: (action) => ipcRenderer.invoke("demo:pet-action", action),
  onState: (callback) => {
    ipcRenderer.removeAllListeners("state:update");
    ipcRenderer.on("state:update", (_event, state) => callback(state));
  }
});
