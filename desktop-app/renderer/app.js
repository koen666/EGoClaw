const NAV_ITEMS = [
  ["home", "首页总览"],
  ["sync", "同步中心"],
  ["map", "成长地图"],
  ["distill", "内容蒸馏"],
  ["action", "当前行动"],
  ["dialogue", "对话与解释"],
  ["settings", "设置"]
];

const state = {
  snapshot: null
};

const refs = {
  onboarding: document.getElementById("onboarding"),
  setupSteps: document.getElementById("setup-steps"),
  connectDemo: document.getElementById("connect-demo"),
  navList: document.getElementById("nav-list"),
  sidebarIntent: document.getElementById("sidebar-intent"),
  sidebarMemory: document.getElementById("sidebar-memory"),
  pageTitle: document.getElementById("page-title"),
  statusBadge: document.getElementById("status-badge"),
  homeIntentTitle: document.getElementById("home-intent-title"),
  homeIntentSummary: document.getElementById("home-intent-summary"),
  homeAction: document.getElementById("home-action"),
  homeIntentList: document.getElementById("home-intent-list"),
  homeNudgeHistory: document.getElementById("home-nudge-history"),
  syncAgentList: document.getElementById("sync-agent-list"),
  syncVideos: document.getElementById("sync-videos"),
  syncDetail: document.getElementById("sync-detail"),
  graph: document.getElementById("graph"),
  mapFocus: document.getElementById("map-focus"),
  mapMemory: document.getElementById("map-memory"),
  distillList: document.getElementById("distill-list"),
  distillDetail: document.getElementById("distill-detail"),
  actionOverview: document.getElementById("action-overview"),
  actionSteps: document.getElementById("action-steps"),
  supportVideos: document.getElementById("support-videos"),
  chatMessages: document.getElementById("chat-messages"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
  dialogueDetail: document.getElementById("dialogue-detail"),
  settingsList: document.getElementById("settings-list"),
  logs: document.getElementById("logs"),
  rerunPipeline: document.getElementById("rerun-pipeline"),
  simulateDouyin: document.getElementById("simulate-douyin"),
  simulateEvening: document.getElementById("simulate-evening"),
  simulateResume: document.getElementById("simulate-resume"),
  goAction: document.getElementById("go-action"),
  goDialogue: document.getElementById("go-dialogue")
};

bindEvents();

window.egoclawApp.onState((snapshot) => {
  state.snapshot = snapshot;
  render();
});

window.egoclawApp.getState().then((snapshot) => {
  state.snapshot = snapshot;
  render();
});

function bindEvents() {
  refs.connectDemo.addEventListener("click", () => window.egoclawApp.connectDemo());
  refs.rerunPipeline.addEventListener("click", () => window.egoclawApp.rerunPipeline());
  refs.simulateDouyin.addEventListener("click", () => window.egoclawApp.simulateTrigger("douyin_open"));
  refs.simulateEvening.addEventListener("click", () => window.egoclawApp.simulateTrigger("evening_window"));
  refs.simulateResume.addEventListener("click", () => window.egoclawApp.simulateTrigger("resume_path"));
  refs.goAction.addEventListener("click", () => window.egoclawApp.petAction("start"));
  refs.goDialogue.addEventListener("click", async () => {
    await window.egoclawApp.setPage("dialogue");
    await window.egoclawApp.sendChat("为什么提醒我这个？");
  });
  refs.chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = refs.chatInput.value.trim();
    if (!text) return;
    refs.chatInput.value = "";
    await window.egoclawApp.sendChat(text);
  });
  document.querySelectorAll(".quick-question").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.sendChat(button.dataset.question));
  });
}

function render() {
  if (!state.snapshot) return;
  renderOnboarding();
  renderSidebar();
  renderTopbar();
  renderPages();
}

function renderOnboarding() {
  refs.onboarding.classList.toggle("hidden", state.snapshot.connected);
  refs.setupSteps.innerHTML = state.snapshot.setupSteps
    .map((step) => {
      const cls = ["setup-item", step.status === "done" ? "done" : "", step.status === "active" ? "active" : ""]
        .filter(Boolean)
        .join(" ");
      return `<div class="${cls}"><strong>${step.title}</strong><span>${step.desc}</span></div>`;
    })
    .join("");
  refs.connectDemo.textContent = state.snapshot.processing ? "正在初始化..." : "连接 Demo 收藏夹";
  refs.connectDemo.disabled = state.snapshot.processing;
}

function renderSidebar() {
  refs.navList.innerHTML = NAV_ITEMS.map(([id, title]) => {
    const active = state.snapshot.currentPage === id ? "active" : "";
    return `<button class="nav-item ${active}" data-page="${id}"><strong>${title}</strong><span>${navDesc(id)}</span></button>`;
  }).join("");
  refs.navList.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.setPage(button.dataset.page));
  });

  const intent = currentIntent();
  refs.sidebarIntent.innerHTML = intent
    ? `<p class="eyebrow">当前主意图</p><h3>${intent.name}</h3><p class="lead" style="font-size:15px;margin-top:10px">${intent.reasons[0] || ""}</p>${pillRow([
        ["accent", `score ${intent.score}`],
        ["blue", `${Math.round(intent.confidence * 100)}%`]
      ])}`
    : `<p class="eyebrow">当前主意图</p><h3>等待连接</h3>`;

  const soul = state.snapshot.soulMemory[0];
  refs.sidebarMemory.innerHTML = soul
    ? `<p class="eyebrow">最近沉淀</p><h3>${soul.title}</h3><p class="lead" style="font-size:15px;margin-top:10px">${soul.body}</p>`
    : `<p class="eyebrow">最近沉淀</p><h3>暂无 soul.md</h3>`;
}

function renderTopbar() {
  refs.pageTitle.textContent = NAV_ITEMS.find(([id]) => id === state.snapshot.currentPage)?.[1] || "EGoclaw";
  const badgeText = !state.snapshot.connected
    ? "等待连接"
    : state.snapshot.pet.lastTriggerId === "douyin_open"
    ? "检测到抖音前台"
    : state.snapshot.pet.lastTriggerId === "resume_path"
    ? "检测到路径重启"
    : state.snapshot.pet.lastTriggerId === "evening_window"
    ? "当前为空闲时间窗口"
    : "收藏夹已同步";
  refs.statusBadge.textContent = badgeText;
}

function renderPages() {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === state.snapshot.currentPage);
  });
  renderHome();
  renderSync();
  renderMap();
  renderDistill();
  renderAction();
  renderDialogue();
  renderSettings();
}

function renderHome() {
  const intent = currentIntent();
  if (!intent) return;
  refs.homeIntentTitle.textContent = intent.name;
  refs.homeIntentSummary.textContent = intent.reasons.join("，");
  refs.homeAction.innerHTML = actionCard(state.snapshot.planner);
  refs.homeIntentList.innerHTML = state.snapshot.intents
    .slice(0, 3)
    .map((intentItem) => stackItem(intentItem.name, intentItem.reasons.join(" / "), `${intentItem.score}`))
    .join("");
  refs.homeNudgeHistory.innerHTML = (state.snapshot.nudgeHistory.length ? state.snapshot.nudgeHistory : [{ title: "等待提醒", body: "连接后会在合适时机由灵宝触发提醒。", time: "" }])
    .map((item) => stackItem(item.title, item.body, item.time))
    .join("");
}

function renderSync() {
  refs.syncAgentList.innerHTML = Object.entries(state.snapshot.agentState)
    .map(([id, agent]) => {
      const cls = ["agent-card", agent.status].filter(Boolean).join(" ");
      return `<div class="${cls}"><strong>${id}</strong><span>${agent.output}</span><div class="agent-status">${agent.status}</div></div>`;
    })
    .join("");

  refs.syncVideos.innerHTML = state.snapshot.archive
    .map((video) => {
      const active = state.snapshot.activeVideoId === video.videoId ? "active" : "";
      return `<button class="stack-item selectable ${active}" data-video-id="${video.videoId}">
        <div class="item-topline"><span>${video.source}</span><span>${video.savedAt}</span></div>
        <p><strong>${video.title}</strong></p>
        <p class="muted" style="margin-top:8px">${video.description}</p>
      </button>`;
    })
    .join("");
  refs.syncVideos.querySelectorAll("[data-video-id]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.selectVideo(button.dataset.videoId));
  });

  const video = currentVideo();
  refs.syncDetail.innerHTML = video
    ? detailCard(video.skill, [
        ["topic", video.topic],
        ["goal", video.goal],
        ["friction", video.friction],
        ["recommended action", video.action],
        ["evidence", video.evidence.join(" / ")]
      ])
    : "";
}

function renderMap() {
  renderGraph();
  const intent = currentIntent();
  refs.mapFocus.innerHTML = intent ? detailCard(intent.name, [
    ["reasons", intent.reasons.join(" / ")],
    ["support videos", String(intent.supportVideoIds.length)],
    ["current action", state.snapshot.planner?.action || ""]
  ]) : "";
  refs.mapMemory.innerHTML = [...state.snapshot.skillMemory, ...state.snapshot.soulMemory].map((item) => stackItem(item.title, item.body, "")).join("");
}

function renderDistill() {
  refs.distillList.innerHTML = state.snapshot.distilledVideos
    .map((video) => {
      const active = state.snapshot.activeVideoId === video.videoId ? "active" : "";
      return `<button class="stack-item selectable ${active}" data-video-id="${video.videoId}">
        <div class="item-topline"><span>${video.topic}</span><span>${video.stage}</span></div>
        <p><strong>${video.title}</strong></p>
        <p class="muted" style="margin-top:8px">${video.skill}</p>
      </button>`;
    })
    .join("");
  refs.distillList.querySelectorAll("[data-video-id]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.selectVideo(button.dataset.videoId));
  });
  const video = currentVideo();
  refs.distillDetail.innerHTML = video ? detailCard(video.skill, [
    ["topic", video.topic],
    ["stage", video.stage],
    ["goal", video.goal],
    ["action", video.action],
    ["evidence", video.evidence.join(" / ")]
  ]) : "";
}

function renderAction() {
  refs.actionOverview.innerHTML = actionCard(state.snapshot.planner);
  refs.actionSteps.innerHTML = (state.snapshot.planner?.steps || [])
    .map((step, index) => {
      const done = step.done ? "done" : "";
      return `<label class="stack-item check-item ${done}" data-step-index="${index}">
        <input type="checkbox" ${step.done ? "checked" : ""} />
        <div><strong>${step.title}</strong><p class="muted" style="margin:8px 0 0">${step.desc}</p></div>
      </label>`;
    })
    .join("");
  refs.actionSteps.querySelectorAll("[data-step-index]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      window.egoclawApp.toggleChecklistStep(Number(node.dataset.stepIndex));
    });
  });
  refs.supportVideos.innerHTML = supportVideos()
    .map((video) => `<div class="support-card"><strong>${video.title}</strong><span>${video.source}</span><p style="margin:10px 0 0">${video.action}</p></div>`)
    .join("");
}

function renderDialogue() {
  refs.chatMessages.innerHTML = state.snapshot.chatMessages
    .map((message) => `<div class="bubble ${message.role}">${message.text}</div>`)
    .join("");
  const intent = currentIntent();
  refs.dialogueDetail.innerHTML = intent ? detailCard("为什么是这个", [
    ["当前意图", intent.name],
    ["证据", intent.reasons.join(" / ")],
    ["当前动作", state.snapshot.planner?.action || ""]
  ]) : "";
}

function renderSettings() {
  refs.settingsList.innerHTML = Object.entries(state.snapshot.settings)
    .map(([key, value]) => `<button class="setting-row" data-setting-key="${key}">
      <div><strong>${settingTitle(key)}</strong><span>${settingDesc(key)}</span></div>
      <div class="toggle ${value ? "on" : ""}"></div>
    </button>`)
    .join("");
  refs.settingsList.querySelectorAll("[data-setting-key]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.toggleSetting(button.dataset.settingKey));
  });
  refs.logs.innerHTML = state.snapshot.logs.map((item) => stackItem(item.title || "系统", item.body || item.text, item.time)).join("");
}

function renderGraph() {
  refs.graph.innerHTML = "";
  const nodes = state.snapshot.graph.nodes || [];
  const edges = state.snapshot.graph.edges || [];

  const layout = {
    goal_self: { x: 500, y: 450 },
    intent_expression: { x: 180, y: 120 },
    intent_breakfast: { x: 430, y: 110 },
    intent_ppt: { x: 710, y: 120 },
    intent_photo: { x: 860, y: 300 }
  };

  const computedNodes = nodes.map((node, index) => {
    if (node.type === "goal") return { ...node, ...layout.goal_self };
    if (node.type === "intent") return { ...node, ...(layout[`intent_${node.intentId}`] || { x: 160 + index * 120, y: 120 }) };
    const intentRoot = layout[`intent_${node.intentId}`] || { x: 200, y: 200 };
    return {
      ...node,
      x: intentRoot.x + (node.type === "skill" ? -40 + (node.order || 0) * 120 : 0),
      y: intentRoot.y + (node.type === "skill" ? 130 : 220)
    };
  });

  edges.forEach((edge) => {
    const from = computedNodes.find((node) => node.id === edge.from);
    const to = computedNodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    line.setAttribute("stroke", "rgba(32,34,38,0.12)");
    line.setAttribute("stroke-width", "2");
    refs.graph.appendChild(line);
  });

  computedNodes.forEach((node) => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const isGoal = node.type === "goal";
    const isActive = node.intentId === state.snapshot.activeIntentId;
    const width = isGoal ? 220 : node.type === "intent" ? 150 : 130;
    const height = 48;
    rect.setAttribute("x", node.x - width / 2);
    rect.setAttribute("y", node.y - height / 2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", "20");
    rect.setAttribute("fill", isGoal ? "#202226" : isActive ? "rgba(203,122,75,0.16)" : node.type === "intent" ? "rgba(92,125,255,0.12)" : "rgba(255,255,255,0.86)");
    rect.setAttribute("stroke", isGoal ? "#202226" : isActive ? "#cb7a4b" : "rgba(32,34,38,0.12)");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y + 5);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", isGoal ? "18" : "15");
    text.setAttribute("font-weight", isGoal || node.type === "intent" ? "700" : "600");
    text.setAttribute("fill", isGoal ? "#ffffff" : "#202226");
    text.textContent = node.label;
    refs.graph.appendChild(rect);
    refs.graph.appendChild(text);
  });
}

function currentIntent() {
  return state.snapshot?.intents?.find((item) => item.id === state.snapshot.activeIntentId) || null;
}

function currentVideo() {
  return state.snapshot?.distilledVideos?.find((item) => item.videoId === state.snapshot.activeVideoId) || state.snapshot?.distilledVideos?.[0] || null;
}

function supportVideos() {
  const intent = currentIntent();
  if (!intent) return [];
  return state.snapshot.distilledVideos.filter((video) => intent.supportVideoIds.includes(video.videoId));
}

function navDesc(id) {
  const desc = {
    home: "现在最该开始什么",
    sync: "Agent 如何整理收藏",
    map: "路径和图谱关系",
    distill: "视频如何变成 skill",
    action: "当前可以做什么",
    dialogue: "灵宝为什么这样提醒",
    settings: "桌宠与同步行为"
  };
  return desc[id];
}

function settingTitle(key) {
  return {
    autoNudge: "自动触发提醒",
    petPersistent: "灵宝常驻桌面",
    startupLaunch: "开机自动启动",
    animationEnabled: "抖音边缘跳出动画"
  }[key];
}

function settingDesc(key) {
  return {
    autoNudge: "允许系统在合适时机主动触发灵宝。",
    petPersistent: "关闭主窗口后，桌宠依然留在桌面。",
    startupLaunch: "模拟桌面宠物型产品的常驻体验。",
    animationEnabled: "检测到抖音前台后，从边缘跳出提醒。"
  }[key];
}

function actionCard(planner) {
  if (!planner) return "";
  return `<div class="detail-card">
    <strong>${planner.action}</strong>
    <span>${planner.whyNow}</span>
    ${pillRow([
      ["accent", planner.title],
      ["blue", `${planner.estimatedMinutes} 分钟`]
    ])}
  </div>`;
}

function detailCard(title, rows) {
  return `<div class="detail-card"><strong>${title}</strong><div class="kv-list">${rows
    .map(([key, value]) => `<div class="kv-row"><strong>${key}</strong><span>${value}</span></div>`)
    .join("")}</div></div>`;
}

function stackItem(title, body, time) {
  return `<div class="stack-item">
    <div class="item-topline"><span>${title}</span><span>${time || ""}</span></div>
    <p>${body}</p>
  </div>`;
}

function pillRow(pills) {
  return `<div class="pill-row">${pills
    .map(([type, text]) => `<span class="pill ${type}">${text}</span>`)
    .join("")}</div>`;
}
