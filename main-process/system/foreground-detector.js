import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function detectForegroundApplication() {
  if (process.platform === "darwin") {
    try {
      const script = 'tell application "System Events" to get name of first application process whose frontmost is true';
      const { stdout } = await execFileAsync("osascript", ["-e", script]);
      return { name: stdout.trim() };
    } catch (error) {
      return { name: null };
    }
  }

  return { name: null };
}
