import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("egoclawPet", {
  getState: () => ipcRenderer.invoke("demo:get-state"),
  focusAction: () => ipcRenderer.invoke("pet:focus-action"),
  reposition: () => ipcRenderer.invoke("pet:reposition"),
  startDrag: (pointer) => ipcRenderer.send("pet:drag-start", pointer),
  drag: (pointer) => ipcRenderer.send("pet:drag-move", pointer),
  endDrag: (pointer) => ipcRenderer.send("pet:drag-end", pointer),
  onState: (callback) => {
    ipcRenderer.removeAllListeners("state:update");
    ipcRenderer.on("state:update", (_event, state) => callback(state));
  }
});
