import { runKimiJson } from "./client/kimi.js";

function fallbackDistill(video) {
  const text = video.mergedText;
  if (/面试|自我介绍|演讲|汇报/.test(text)) {
    return {
      topic: "表达力",
      skill: /自我介绍/.test(text) ? "1 分钟自我介绍" : "演讲结构搭建",
      stage: "入门",
      goal: /面试/.test(text) ? "下周面试表达更稳" : "汇报表达更清晰",
      friction: /结构/.test(text)
        ? "脑子里有很多点，但表达时不成结构。"
        : "开口容易卡住，不知道怎么组织顺序。",
      action: /自我介绍/.test(text) ? "今晚录一版 60 秒自我介绍。" : "写出 3 句式开场结构。",
      confidence: 0.86
    };
  }
  if (/早餐|减脂/.test(text)) {
    return {
      topic: "低脂早餐",
      skill: "快手早餐搭配",
      stage: "入门",
      goal: "早餐健康且可持续",
      friction: "早上没时间，也不想准备复杂食材。",
      action: "今晚把鸡蛋、酸奶和燕麦备好。",
      confidence: 0.81
    };
  }
  if (/PPT|大纲|汇报/.test(text)) {
    return {
      topic: "PPT 表达",
      skill: /大纲/.test(text) ? "AI 辅助列大纲" : "汇报开场页设计",
      stage: "入门",
      goal: /大纲/.test(text) ? "更快开始做 PPT" : "提升汇报质感",
      friction: /大纲/.test(text)
        ? "不知道第一页之后该怎么继续展开。"
        : "收藏了很多模板，但自己一做就空。",
      action: /大纲/.test(text) ? "把明天汇报主题写成 4 行提纲。" : "今晚做 1 页标题页。",
      confidence: 0.84
    };
  }
  return {
    topic: "摄影",
    skill: "构图入门",
    stage: "入门",
    goal: "提升审美与拍照稳定性",
    friction: "拍照总觉得杂乱，没有明确主体。",
    action: "今晚拍 3 张对称构图练习。",
    confidence: 0.79
  };
}

export async function runDistillAgent(video) {
  const fallback = () => fallbackDistill(video);
  const result = await runKimiJson({
    system:
      "你是 EGoclaw 的 Distill Agent。你要把短视频内容蒸馏成结构化 skill。返回字段: topic, skill, stage, goal, friction, action, confidence。",
    user: `请蒸馏以下视频内容：\n${video.mergedText}`,
    fallback
  });

  return {
    videoId: video.videoId,
    title: video.title,
    source: video.source,
    savedAt: video.savedAt,
    summary: video.description,
    evidence: [video.title, video.ocr, video.tags.join("/")],
    ...result
  };
}
