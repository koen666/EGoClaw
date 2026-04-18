(function () {
  const STORAGE_KEY = "egoclaw-demo-state";

  const distilledVideos = [
    {
      id: "video-expression-1",
      title: "面试自我介绍怎么说不紧张",
      topic: "表达力",
      skill: "1 分钟自我介绍",
      stage: "入门",
      action: "今晚录一版 60 秒自我介绍",
      friction: "一开口容易卡住，不知道怎么组织顺序",
      goal: "下周面试表达更稳"
    },
    {
      id: "video-expression-2",
      title: "演讲结构技巧：先说结果再展开",
      topic: "表达力",
      skill: "演讲结构搭建",
      stage: "入门",
      action: "写出 3 句式开场结构",
      friction: "容易想到很多点但没有结构",
      goal: "汇报表达更清晰"
    },
    {
      id: "video-breakfast-1",
      title: "10 分钟低脂早餐，早八也能做",
      topic: "低脂早餐",
      skill: "快手早餐搭配",
      stage: "入门",
      action: "准备鸡蛋、酸奶和即食燕麦",
      friction: "早上起不来，不想复杂准备",
      goal: "早餐健康且可持续"
    },
    {
      id: "video-ppt-1",
      title: "PPT 开场页怎么做更高级",
      topic: "PPT 表达",
      skill: "汇报开场页设计",
      stage: "入门",
      action: "今晚做 1 页标题页",
      friction: "看了很多模板但不会自己做",
      goal: "提升汇报质感"
    },
    {
      id: "video-ppt-2",
      title: "AI 帮你 3 分钟做完 PPT 大纲",
      topic: "PPT 表达",
      skill: "AI 辅助列大纲",
      stage: "入门",
      action: "把明天汇报主题写成 4 行提纲",
      friction: "不知道第一页之后该怎么继续",
      goal: "更快开始做 PPT"
    },
    {
      id: "video-photo-1",
      title: "手机摄影构图 3 个基础原则",
      topic: "摄影",
      skill: "构图入门",
      stage: "入门",
      action: "今晚拍 3 张对称构图练习",
      friction: "总觉得照片很乱，没有视觉重点",
      goal: "提升审美与拍照稳定性"
    }
  ];

  const intents = {
    expression: {
      id: "expression",
      name: "准备面试表达",
      score: 91,
      confidence: 0.89,
      evidence: ["近 7 天收藏 2 条表达类视频", "下周有面试场景", "曾开始但中断"],
      relatedVideoIds: ["video-expression-1", "video-expression-2"],
      action: "今晚录一版 60 秒自我介绍",
      whyNow: "今晚有空闲窗口，且面试场景临近。"
    },
    breakfast: {
      id: "breakfast",
      name: "开始低脂早餐",
      score: 75,
      confidence: 0.76,
      evidence: ["早餐主题在最近 14 天内重复出现", "任务门槛低，容易起步"],
      relatedVideoIds: ["video-breakfast-1"],
      action: "今晚把明早要用的早餐食材备好",
      whyNow: "明早可以直接开做，阻力最小。"
    },
    ppt: {
      id: "ppt",
      name: "重启 PPT 入门路径",
      score: 82,
      confidence: 0.81,
      evidence: ["连续 3 天重复出现 PPT 内容", "最近重新刷到相关内容"],
      relatedVideoIds: ["video-ppt-1", "video-ppt-2"],
      action: "今晚先做 1 页 PPT 开场页",
      whyNow: "兴趣正在升温，且任务足够轻。"
    }
  };

  const triggers = [
    {
      id: "douyin-open",
      title: "模拟打开抖音 App",
      subtitle: "桌宠常驻时检测到抖音被打开，检查是否存在最近升温的意图。",
      intentId: "ppt",
      message:
        "主人，你这几天又刷到 PPT 内容了，我猜你不是随便看看，我帮你把收藏夹里相关内容串成了一条入门路径。"
    },
    {
      id: "evening-free",
      title: "今晚有空闲时间",
      subtitle: "上下文检测到晚间空档，适合推一个轻量动作。",
      intentId: "expression",
      message:
        "主人，你上周收藏的“面试自我介绍”我帮你整理好了，要不要今晚练 1 分钟版？"
    },
    {
      id: "restart-breakfast",
      title: "重新刷到低脂早餐",
      subtitle: "同类内容重新出现，系统判断可以轻量接回中断路径。",
      intentId: "breakfast",
      message:
        "你之前想学低脂早餐，明早 10 分钟就能做一个最简单版本，要不要我陪你试一次？"
    },
    {
      id: "resume-expression",
      title: "之前开始过但断掉了",
      subtitle: "系统检测到路径中断后重新升温，适合发一次温和提醒。",
      intentId: "expression",
      message:
        "你之前想开始的这件事，我还替你记着。今天不用做很多，我们先把第一步点亮。"
    }
  ];

  const graphNodes = [
    { id: "intent-expression", label: "表达力", x: 180, y: 140, type: "intent", intentId: "expression" },
    { id: "skill-expression-1", label: "1 分钟自我介绍", x: 80, y: 260, type: "skill", intentId: "expression" },
    { id: "skill-expression-2", label: "演讲结构", x: 250, y: 270, type: "skill", intentId: "expression" },
    { id: "intent-breakfast", label: "低脂早餐", x: 430, y: 120, type: "intent", intentId: "breakfast" },
    { id: "skill-breakfast-1", label: "快手早餐搭配", x: 430, y: 265, type: "skill", intentId: "breakfast" },
    { id: "intent-ppt", label: "PPT 表达", x: 670, y: 150, type: "intent", intentId: "ppt" },
    { id: "skill-ppt-1", label: "开场页设计", x: 600, y: 280, type: "skill", intentId: "ppt" },
    { id: "skill-ppt-2", label: "AI 列提纲", x: 760, y: 290, type: "skill", intentId: "ppt" },
    { id: "goal", label: "变成热爱的自己", x: 430, y: 390, type: "goal" }
  ];

  const graphEdges = [
    ["intent-expression", "skill-expression-1"],
    ["intent-expression", "skill-expression-2"],
    ["intent-breakfast", "skill-breakfast-1"],
    ["intent-ppt", "skill-ppt-1"],
    ["intent-ppt", "skill-ppt-2"],
    ["intent-expression", "goal"],
    ["intent-breakfast", "goal"],
    ["intent-ppt", "goal"]
  ];

  const defaultState = {
    currentIntentId: "expression",
    activeNudge: null,
    petStatus: "idle",
    lastAction: "今晚录一版 60 秒自我介绍",
    logs: [
      logEntry("系统启动，Mock 收藏夹已同步。"),
      logEntry("蒸馏完成，生成 3 条核心意图。")
    ]
  };

  let state = loadState();

  const refs = {
    heroMetrics: document.getElementById("hero-metrics"),
    triggerGrid: document.getElementById("trigger-grid"),
    distillList: document.getElementById("distill-list"),
    actionCard: document.getElementById("action-card"),
    currentIntentCard: document.getElementById("current-intent-card"),
    eventLog: document.getElementById("event-log"),
    petMessage: document.getElementById("pet-message"),
    petStatusLabel: document.getElementById("pet-status-label"),
    petBubble: document.getElementById("pet-bubble"),
    petAvatar: document.getElementById("pet-avatar"),
    growthMap: document.getElementById("growth-map")
  };

  document.getElementById("pet-start").addEventListener("click", startCurrentAction);
  document.getElementById("pet-snooze").addEventListener("click", snoozeCurrentAction);
  document.getElementById("pet-dismiss").addEventListener("click", dismissCurrentAction);
  document.getElementById("reset-demo").addEventListener("click", resetDemo);
  document.getElementById("focus-current-intent").addEventListener("click", function () {
    renderGraph(state.currentIntentId);
    pushLog("知识图谱已聚焦当前主意图。");
  });
  refs.petAvatar.addEventListener("click", function () {
    refs.petBubble.classList.toggle("is-collapsed");
  });

  render();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { ...defaultState };
    } catch (error) {
      return { ...defaultState };
    }
  }

  function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function logEntry(text) {
    return {
      text: text,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    };
  }

  function pushLog(text) {
    state.logs = [logEntry(text)].concat(state.logs).slice(0, 14);
    persistState();
    renderLog();
  }

  function getCurrentIntent() {
    return intents[state.currentIntentId];
  }

  function getCurrentNudge() {
    if (!state.activeNudge) {
      const intent = getCurrentIntent();
      return {
        intentId: intent.id,
        message: "主人，我已经把你最近的收藏整理好了。点我，我带你去看最值得开始的一步。",
        action: intent.action
      };
    }
    return state.activeNudge;
  }

  function render() {
    renderHeroMetrics();
    renderTriggers();
    renderDistillCards();
    renderCurrentIntent();
    renderActionCard();
    renderPet();
    renderGraph(state.currentIntentId);
    renderLog();
  }

  function renderHeroMetrics() {
    const currentIntent = getCurrentIntent();
    refs.heroMetrics.innerHTML = [
      metric("已同步收藏", "24"),
      metric("蒸馏技能节点", "8"),
      metric("当前主意图", currentIntent.name),
      metric("灵宝状态", state.petStatus === "idle" ? "待机" : "已触发")
    ].join("");
  }

  function metric(label, value) {
    return (
      '<div class="metric-card">' +
      '<p class="metric-label">' + label + "</p>" +
      '<p class="metric-value">' + value + "</p>" +
      "</div>"
    );
  }

  function renderTriggers() {
    refs.triggerGrid.innerHTML = triggers
      .map(function (trigger) {
        return (
          '<button class="trigger-button" data-trigger-id="' +
          trigger.id +
          '">' +
          '<p class="trigger-title">' +
          trigger.title +
          "</p>" +
          '<p class="trigger-subtitle">' +
          trigger.subtitle +
          "</p>" +
          "</button>"
        );
      })
      .join("");

    refs.triggerGrid.querySelectorAll("[data-trigger-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        activateTrigger(button.getAttribute("data-trigger-id"));
      });
    });
  }

  function activateTrigger(triggerId) {
    const trigger = triggers.find(function (item) {
      return item.id === triggerId;
    });
    const intent = intents[trigger.intentId];

    state.currentIntentId = intent.id;
    state.petStatus = "triggered";
    state.lastAction = intent.action;
    state.activeNudge = {
      intentId: intent.id,
      message: trigger.message,
      action: intent.action,
      reason: intent.evidence
    };

    pushLog("触发器执行: " + trigger.title + " -> " + intent.name);
    persistState();
    render();
  }

  function renderDistillCards() {
    refs.distillList.innerHTML = distilledVideos
      .map(function (video) {
        return (
          '<article class="distill-card">' +
          '<div class="distill-topline">' +
          '<span class="distill-topic">' +
          video.topic +
          "</span>" +
          '<span class="muted">' +
          video.stage +
          "</span>" +
          "</div>" +
          "<h3>" +
          video.title +
          "</h3>" +
          "<p><strong>skill:</strong> " +
          video.skill +
          "</p>" +
          "<p><strong>action:</strong> " +
          video.action +
          "</p>" +
          "<p><strong>friction:</strong> " +
          video.friction +
          "</p>" +
          '<div class="pill-row">' +
          '<span class="mini-pill">' +
          video.goal +
          "</span>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderCurrentIntent() {
    const intent = getCurrentIntent();
    refs.currentIntentCard.innerHTML =
      '<article class="intent-card">' +
      '<div class="action-meta">' +
      "<strong>当前意图</strong>" +
      '<span class="intent-score">score ' +
      intent.score +
      "</span>" +
      "</div>" +
      "<h3>" +
      intent.name +
      "</h3>" +
      "<p>" +
      intent.whyNow +
      "</p>" +
      '<div class="pill-row">' +
      intent.evidence
        .map(function (item) {
          return '<span class="mini-pill">' + item + "</span>";
        })
        .join("") +
      "</div>" +
      "</article>";

    refs.petStatusLabel.textContent = state.petStatus === "idle" ? "桌宠待机中" : "桌宠已进入提醒状态";
  }

  function renderActionCard() {
    const intent = getCurrentIntent();
    refs.actionCard.innerHTML =
      '<div class="action-meta">' +
      '<span class="distill-topic">' +
      intent.name +
      "</span>" +
      '<span class="muted">置信度 ' +
      Math.round(intent.confidence * 100) +
      "%</span>" +
      "</div>" +
      "<h3>" +
      intent.action +
      "</h3>" +
      "<p>为什么是现在: " +
      intent.whyNow +
      "</p>" +
      "<p>执行方式: 打开灵宝后立即进入当前动作卡片，先做一件最小动作，不进入复杂待办。</p>" +
      '<div class="pill-row">' +
      '<span class="mini-pill">从收藏内容自动整理</span>' +
      '<span class="mini-pill">由 Planner 选出第一步</span>' +
      '<span class="mini-pill">由桌宠主动提醒</span>' +
      "</div>";
  }

  function renderPet() {
    const nudge = getCurrentNudge();
    refs.petMessage.textContent = nudge.message;
  }

  function renderLog() {
    refs.eventLog.innerHTML = state.logs
      .map(function (item) {
        return (
          '<div class="log-item">' +
          item.text +
          '<span class="log-time">' +
          item.time +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderGraph(highlightIntentId) {
    const svg = refs.growthMap;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    graphEdges.forEach(function (edge) {
      const from = graphNodes.find(function (node) {
        return node.id === edge[0];
      });
      const to = graphNodes.find(function (node) {
        return node.id === edge[1];
      });
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("stroke", "rgba(31,26,20,0.16)");
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);
    });

    graphNodes.forEach(function (node) {
      const isGoal = node.type === "goal";
      const isActive = node.intentId === highlightIntentId;
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      const width = isGoal ? 180 : node.type === "intent" ? 130 : 120;
      const height = isGoal ? 56 : 48;
      rect.setAttribute("x", node.x - width / 2);
      rect.setAttribute("y", node.y - height / 2);
      rect.setAttribute("rx", isGoal ? "24" : "18");
      rect.setAttribute("width", width);
      rect.setAttribute("height", height);
      rect.setAttribute(
        "fill",
        isGoal ? "#1f1a14" : isActive ? "rgba(239,91,42,0.16)" : node.type === "intent" ? "rgba(35,96,255,0.12)" : "rgba(255,255,255,0.72)"
      );
      rect.setAttribute(
        "stroke",
        isGoal ? "#1f1a14" : isActive ? "#ef5b2a" : node.type === "intent" ? "rgba(35,96,255,0.36)" : "rgba(31,26,20,0.12)"
      );
      rect.setAttribute("stroke-width", isActive ? "2.2" : "1.2");

      text.setAttribute("x", node.x);
      text.setAttribute("y", node.y + 5);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", isGoal ? "18" : "15");
      text.setAttribute("font-weight", isGoal || node.type === "intent" ? "700" : "600");
      text.setAttribute("fill", isGoal ? "#ffffff" : "#1f1a14");
      text.textContent = node.label;

      group.appendChild(rect);
      group.appendChild(text);
      svg.appendChild(group);
    });
  }

  function startCurrentAction() {
    const intent = getCurrentIntent();
    state.petStatus = "idle";
    state.activeNudge = {
      intentId: intent.id,
      message: "好，我们现在就开始。我已经把第一步拆得很轻了，先点亮这一格。",
      action: intent.action
    };
    pushLog("用户选择开始动作: " + intent.action);
    persistState();
    render();
  }

  function snoozeCurrentAction() {
    state.petStatus = "idle";
    pushLog("用户选择晚点提醒，桌宠延后本次触发。");
    persistState();
    render();
  }

  function dismissCurrentAction() {
    state.petStatus = "idle";
    pushLog("用户反馈: 不是这个方向，系统等待下次重新判断。");
    persistState();
    render();
  }

  function resetDemo() {
    state = {
      currentIntentId: defaultState.currentIntentId,
      activeNudge: defaultState.activeNudge,
      petStatus: defaultState.petStatus,
      lastAction: defaultState.lastAction,
      logs: defaultState.logs.slice()
    };
    persistState();
    render();
  }
})();
