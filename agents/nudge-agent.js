import { runKimiJson } from "./client/kimi.js";

function fallbackNudge(currentIntent, planner, trigger) {
  const messages = {
    douyin_open:
      "主人，你这几天又刷到相关内容了。我猜你不是随便看看，我已经把这条路径整理出来了。",
    evening_window:
      `主人，我帮你把这件事拆轻了。今晚只做「${planner.action.replace(/。$/, "")}」就够了，要不要开始？`,
    resume_path:
      "你之前想开始的这件事，我还替你记着。今天不用做很多，我们先把第一步点亮。"
  };

  return {
    message: messages[trigger.id] || messages.evening_window,
    meta: `${trigger.title}：${currentIntent.reasons[0]}`,
    priority: currentIntent.score >= 85 ? "high" : "medium"
  };
}

export async function runNudgeAgent(currentIntent, planner, trigger) {
  const fallback = () => fallbackNudge(currentIntent, planner, trigger);
  return runKimiJson({
    system:
      "你是 EGoclaw 的 Nudge Agent。你要基于当前意图、当前动作和触发场景，生成桌宠提醒。返回字段: message, meta, priority。",
    user: JSON.stringify({ currentIntent, planner, trigger }, null, 2),
    fallback
  });
}
