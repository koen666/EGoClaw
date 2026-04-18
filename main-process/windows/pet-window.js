import path from "node:path";
import { BrowserWindow, screen } from "electron";

function getDockBounds() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  return {
    x: width - 420,
    y: height - 220,
    width: 360,
    height: 180
  };
}

export function createPetWindow() {
  const dock = getDockBounds();
  const win = new BrowserWindow({
    x: dock.x,
    y: dock.y,
    width: dock.width,
    height: dock.height,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(process.cwd(), "pet-runtime/pet-preload.js"),
      contextIsolation: true,
      sandbox: false
    }
  });

  win.loadFile(path.join(process.cwd(), "pet-runtime/pet.html"));
  return {
    window: win,
    dock() {
      const bounds = getDockBounds();
      win.setBounds(bounds);
    },
    animateFromOrigin(origin = { x: 36, y: 280 }) {
      const target = getDockBounds();
      const steps = 12;
      let current = 0;
      const width = target.width;
      const height = target.height;
      const timer = setInterval(() => {
        current += 1;
        const progress = Math.min(current / steps, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        win.setBounds({
          x: Math.round(origin.x + (target.x - origin.x) * eased),
          y: Math.round(origin.y + (target.y - origin.y) * eased),
          width,
          height
        });
        if (progress >= 1) {
          clearInterval(timer);
        }
      }, 22);
    }
  };
}
