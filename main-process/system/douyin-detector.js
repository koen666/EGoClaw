import { detectForegroundApplication } from "./foreground-detector.js";

const MATCHERS = ["抖音", "douyin", "tiktok"];

export function createDouyinDetector({ onOpen, onStateChange }) {
  let wasOpen = false;
  let timer = null;

  async function tick() {
    const result = await detectForegroundApplication();
    const name = (result?.name || "").toLowerCase();
    const isOpen = MATCHERS.some((keyword) => name.includes(keyword.toLowerCase()));
    if (isOpen && !wasOpen) {
      onOpen?.();
    }
    if (isOpen !== wasOpen) {
      onStateChange?.(isOpen, result);
    }
    wasOpen = isOpen;
  }

  return {
    start(intervalMs = 3000) {
      if (timer) return;
      void tick();
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };
}
