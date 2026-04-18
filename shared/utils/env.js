import fs from "node:fs";
import path from "node:path";

let cachedEnv = null;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.trim().startsWith("#"))
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

export function loadEnv() {
  if (cachedEnv) return cachedEnv;
  const cwd = process.cwd();
  const envFile = parseEnvFile(path.join(cwd, ".env"));
  const localEnvFile = parseEnvFile(path.join(cwd, ".env.local"));
  const fileEnv = {
    ...envFile,
    ...localEnvFile
  };
  cachedEnv = {
    KIMI_API_KEY: process.env.KIMI_API_KEY || fileEnv.KIMI_API_KEY || "",
    KIMI_BASE_URL: process.env.KIMI_BASE_URL || fileEnv.KIMI_BASE_URL || "https://api.moonshot.ai/v1",
    KIMI_MODEL: process.env.KIMI_MODEL || fileEnv.KIMI_MODEL || "kimi-k2",
    MYSQL_HOST: process.env.MYSQL_HOST || fileEnv.MYSQL_HOST || "127.0.0.1",
    MYSQL_PORT: process.env.MYSQL_PORT || fileEnv.MYSQL_PORT || "3306",
    MYSQL_USER: process.env.MYSQL_USER || fileEnv.MYSQL_USER || "root",
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || fileEnv.MYSQL_PASSWORD || "",
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || fileEnv.MYSQL_DATABASE || "egoclaw_demo"
  };
  return cachedEnv;
}
