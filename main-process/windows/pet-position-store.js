import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const STORE_FILE_NAME = "pet-window-state.json";

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function createPetPositionStore() {
  const storePath = path.join(app.getPath("userData"), STORE_FILE_NAME);

  return {
    load() {
      try {
        const raw = JSON.parse(fs.readFileSync(storePath, "utf8"));
        if (!isFiniteNumber(raw?.x) || !isFiniteNumber(raw?.y)) {
          return null;
        }

        return {
          x: raw.x,
          y: raw.y
        };
      } catch {
        return null;
      }
    },

    save(bounds) {
      try {
        fs.mkdirSync(path.dirname(storePath), { recursive: true });
        fs.writeFileSync(
          storePath,
          JSON.stringify(
            {
              x: bounds.x,
              y: bounds.y
            },
            null,
            2
          )
        );
      } catch {
        // Ignore persistence failures and keep the in-memory position.
      }
    }
  };
}
