import { runKimiJson } from "./client/kimi.js";

function fallbackMemory(currentIntent, planner) {
  return {
    skillMd: {
      title: `skill.md / ${planner.action.replace(/。$/, "")}`,
      body: `这次路径的核心 skill 是「${currentIntent.topic}」。最适合当前用户的起步方式是：${planner.action}`
    },
    soulMd: {
      title: "soul.md / 陪伴经验",
      body:
        currentIntent.id === "expression"
          ? "用户最容易卡在开口前。灵宝要先把动作拆成一版可完成的轻动作，而不是催用户直接做好。"
          : "用户更容易被低阻力动作接住。灵宝要先帮助开始，而不是制造新的压力。"
    }
  };
}

export async function runMemoryAgent(currentIntent, planner) {
  const fallback = () => fallbackMemory(currentIntent, planner);
  return runKimiJson({
    system:
      "你是 EGoclaw 的 Memory Agent。请把本次路径和动作沉淀为 skill.md 与 soul.md。返回字段: skillMd{title,body}, soulMd{title,body}。",
    user: JSON.stringify({ currentIntent, planner }, null, 2),
    fallback
  });
}
