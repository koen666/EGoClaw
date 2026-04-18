export async function runGraphAgent(distilledVideos, intentResult) {
  const nodes = [{ id: "goal_self", label: "变成热爱的自己", type: "goal" }];
  const edges = [];

  intentResult.intents.forEach((intent, index) => {
    const intentNodeId = `intent_${intent.id}`;
    nodes.push({ id: intentNodeId, label: intent.topic, type: "intent", intentId: intent.id, order: index });
    edges.push({ from: intentNodeId, to: "goal_self", type: "supports" });

    distilledVideos
      .filter((video) => video.topic === intent.topic)
      .forEach((video, videoIndex) => {
        const skillId = `skill_${video.videoId}`;
        const actionId = `action_${video.videoId}`;
        nodes.push({ id: skillId, label: video.skill, type: "skill", intentId: intent.id, order: videoIndex });
        nodes.push({ id: actionId, label: video.action.replace(/。$/, ""), type: "action", intentId: intent.id, order: videoIndex });
        edges.push({ from: intentNodeId, to: skillId, type: "contains" });
        edges.push({ from: skillId, to: actionId, type: "starts_with" });
      });
  });

  return { nodes, edges };
}
