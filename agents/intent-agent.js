import { runKimiJson } from "./client/kimi.js";

function fallbackIntent(distilledVideos) {
  const groups = distilledVideos.reduce((acc, video) => {
    if (!acc[video.topic]) acc[video.topic] = [];
    acc[video.topic].push(video);
    return acc;
  }, {});

  const topics = Object.entries(groups).map(([topic, videos]) => {
    const reasons = [
      `最近收藏中出现 ${videos.length} 条 ${topic} 相关内容`,
      `当前动作可以直接从「${videos[0].action}」开始`
    ];
    if (topic === "表达力") reasons.push("这条路径和近期面试/表达场景高度相关");
    if (topic === "PPT 表达") reasons.push("最近又重新刷到相关内容");
    if (topic === "低脂早餐") reasons.push("动作足够轻，适合生活方式起步");
    return {
      id:
        topic === "表达力"
          ? "expression"
          : topic === "PPT 表达"
          ? "ppt"
          : topic === "低脂早餐"
          ? "breakfast"
          : "photo",
      name:
        topic === "表达力"
          ? "准备面试表达"
          : topic === "PPT 表达"
          ? "重启 PPT 入门路径"
          : topic === "低脂早餐"
          ? "开始低脂早餐"
          : "练习摄影构图",
      topic,
      score: topic === "表达力" ? 92 : topic === "PPT 表达" ? 84 : topic === "低脂早餐" ? 76 : 68,
      confidence: topic === "表达力" ? 0.91 : topic === "PPT 表达" ? 0.84 : topic === "低脂早餐" ? 0.77 : 0.69,
      reasons,
      supportVideoIds: videos.map((item) => item.videoId)
    };
  });

  return {
    intents: topics.sort((a, b) => b.score - a.score),
    currentIntentId: topics.sort((a, b) => b.score - a.score)[0]?.id || null
  };
}

export async function runIntentAgent(distilledVideos) {
  const fallback = () => fallbackIntent(distilledVideos);
  return runKimiJson({
    system:
      "你是 EGoclaw 的 Intent Agent。基于多个 skill 蒸馏结果，识别用户当前最强的 3 个意图，并给出 currentIntentId。返回字段: intents(数组，含 id,name,topic,score,confidence,reasons,supportVideoIds), currentIntentId。",
    user: JSON.stringify(distilledVideos, null, 2),
    fallback
  });
}
