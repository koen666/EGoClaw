import { runKimiJson } from "./client/kimi.js";

function defaultSteps(intentName) {
  if (intentName.includes("表达")) {
    return [
      { title: "写出 3 句式开场", desc: "先定结构，不追求完整。"},
      { title: "录一版 60 秒口播", desc: "只先跑通一版。"},
      { title: "回听后删掉废话", desc: "保留岗位匹配点。"}
    ];
  }
  if (intentName.includes("PPT")) {
    return [
      { title: "写出汇报标题和一句副标题", desc: "先决定第一页的信息焦点。"},
      { title: "列出 4 页提纲", desc: "用结构带动开始。"},
      { title: "完成 1 页开场页", desc: "把开始变得具体。"}
    ];
  }
  if (intentName.includes("早餐")) {
    return [
      { title: "把食材放到一处", desc: "把准备动作前置到今晚。"},
      { title: "设一个提前 10 分钟的闹钟", desc: "为早餐留出窗口。"},
      { title: "明早做一次最简单版本", desc: "先跑通，不求花样。"}
    ];
  }
  return [
    { title: "理解一个构图原则", desc: "决定今晚练什么。"},
    { title: "拍 3 张练习照片", desc: "每张只练一个重点。"},
    { title: "回看 1 张照片", desc: "建立最基本反馈。"}
  ];
}

function fallbackPlan(currentIntent, supportVideos) {
  return {
    title: currentIntent.name,
    action: supportVideos[0]?.action || "开始一个最小动作。",
    whyNow: currentIntent.reasons.join("；"),
    estimatedMinutes: currentIntent.id === "expression" ? 12 : currentIntent.id === "ppt" ? 15 : 8,
    steps: defaultSteps(currentIntent.name)
  };
}

export async function runPlannerAgent(currentIntent, supportVideos) {
  const fallback = () => fallbackPlan(currentIntent, supportVideos);
  return runKimiJson({
    system:
      "你是 EGoclaw 的 Planner Agent。你要基于当前意图和支撑视频，给出一个最值得开始的动作。返回字段: title, action, whyNow, estimatedMinutes, steps(数组，每项含 title, desc)。",
    user: JSON.stringify({ currentIntent, supportVideos }, null, 2),
    fallback
  });
}
