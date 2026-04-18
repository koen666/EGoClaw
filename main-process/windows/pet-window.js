import path from "node:path";
import { BrowserWindow, screen } from "electron";
import { createPetPositionStore } from "./pet-position-store.js";

const PET_SIZE = {
  width: 164,
  height: 164
};

const PET_MARGIN = {
  x: 28,
  y: 36
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBoundsMidpoint(bounds) {
  return {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2)
  };
}

function getTargetDisplay(bounds) {
  return screen.getDisplayNearestPoint(getBoundsMidpoint(bounds));
}

function getDefaultBounds() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y, width, height } = display.workArea;

  return {
    x: Math.round(x + width - PET_SIZE.width - PET_MARGIN.x),
    y: Math.round(y + height - PET_SIZE.height - PET_MARGIN.y),
    width: PET_SIZE.width,
    height: PET_SIZE.height
  };
}

function clampBounds(bounds) {
  const display = getTargetDisplay(bounds);
  const { x, y, width, height } = display.workArea;
  const maxX = x + width - PET_SIZE.width;
  const maxY = y + height - PET_SIZE.height;

  return {
    x: Math.round(clamp(bounds.x, x, maxX)),
    y: Math.round(clamp(bounds.y, y, maxY)),
    width: PET_SIZE.width,
    height: PET_SIZE.height
  };
}

function boundsMatch(left, right) {
  return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
}

export function createPetWindow() {
  const positionStore = createPetPositionStore();
  const savedOrigin = positionStore.load();
  const initialBounds = clampBounds(
    savedOrigin
      ? {
          x: savedOrigin.x,
          y: savedOrigin.y,
          width: PET_SIZE.width,
          height: PET_SIZE.height
        }
      : getDefaultBounds()
  );
  const win = new BrowserWindow({
    x: initialBounds.x,
    y: initialBounds.y,
    width: initialBounds.width,
    height: initialBounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    fullscreenable: false,
    movable: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(process.cwd(), "pet-runtime/pet-preload.js"),
      contextIsolation: true,
      sandbox: false
    }
  });

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(process.cwd(), "pet-runtime/pet.html"));

  let hasPlacedWindow = false;
  let dragSession = null;

  function persistPosition() {
    positionStore.save(win.getBounds());
  }

  function applyBounds(nextBounds) {
    const safeBounds = clampBounds(nextBounds);
    if (!boundsMatch(win.getBounds(), safeBounds)) {
      win.setBounds(safeBounds);
    }
    hasPlacedWindow = true;
    return safeBounds;
  }

  function ensureWindowPosition(forceDefault = false) {
    if (win.isDestroyed()) return null;

    let nextBounds = null;

    if (forceDefault) {
      nextBounds = getDefaultBounds();
    } else if (hasPlacedWindow) {
      nextBounds = win.getBounds();
    } else {
      const storedOrigin = positionStore.load();
      nextBounds = storedOrigin
        ? {
            x: storedOrigin.x,
            y: storedOrigin.y,
            width: PET_SIZE.width,
            height: PET_SIZE.height
          }
        : getDefaultBounds();
    }

    const appliedBounds = applyBounds(nextBounds);
    persistPosition();
    return appliedBounds;
  }

  function reconcileAfterDisplayChange() {
    ensureWindowPosition(false);
  }

  screen.on("display-added", reconcileAfterDisplayChange);
  screen.on("display-removed", reconcileAfterDisplayChange);
  screen.on("display-metrics-changed", reconcileAfterDisplayChange);

  win.on("closed", () => {
    screen.removeListener("display-added", reconcileAfterDisplayChange);
    screen.removeListener("display-removed", reconcileAfterDisplayChange);
    screen.removeListener("display-metrics-changed", reconcileAfterDisplayChange);
  });

  return {
    window: win,

    syncVisibility(shouldShow) {
      if (shouldShow) {
        ensureWindowPosition(false);
        if (!win.isVisible()) {
          if (process.platform === "darwin") {
            win.showInactive();
          } else {
            win.show();
          }
        }
      } else if (win.isVisible()) {
        dragSession = null;
        win.hide();
      }
    },

    reposition() {
      ensureWindowPosition(true);
    },

    startDrag(pointer) {
      if (win.isDestroyed()) return;
      ensureWindowPosition(false);
      dragSession = {
        pointer: {
          x: pointer.screenX,
          y: pointer.screenY
        },
        bounds: win.getBounds()
      };
    },

    drag(pointer) {
      if (!dragSession || win.isDestroyed()) return;

      applyBounds({
        x: dragSession.bounds.x + (pointer.screenX - dragSession.pointer.x),
        y: dragSession.bounds.y + (pointer.screenY - dragSession.pointer.y),
        width: PET_SIZE.width,
        height: PET_SIZE.height
      });
    },

    endDrag(pointer) {
      if (!dragSession || win.isDestroyed()) return;
      if (pointer) {
        this.drag(pointer);
      }
      dragSession = null;
      persistPosition();
    }
  };
}
