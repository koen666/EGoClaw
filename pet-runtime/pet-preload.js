import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("egoclawPet", {
  getState: () => ipcRenderer.invoke("demo:get-state"),
  petAction: (action) => ipcRenderer.invoke("demo:pet-action", action),
  onState: (callback) => {
    ipcRenderer.removeAllListeners("state:update");
    ipcRenderer.on("state:update", (_event, state) => callback(state));
  }
});
