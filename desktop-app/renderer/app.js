const NAV_ITEMS = [
  ["home", "⌂", "Logbook"],
  ["map", "◫", "Cartography"],
  ["distill", "✦", "Distill"],
  ["dialogue", "◌", "Dialogue"]
];

const GRAPH_VIEWBOX = {
  x: 0,
  y: 0,
  width: 760,
  height: 560
};

const state = {
  snapshot: null,
  authMode: "login",
  chatHistoryCollapsed: false,
  graphViewport: { ...GRAPH_VIEWBOX },
  graphLayoutKey: "",
  graphDrag: null,
  graphCompleted: new Set(),
  graphAnimating: new Set()
};

const refs = {
  authShell: document.getElementById("auth-shell"),
  authTitle: document.getElementById("auth-title"),
  authStatus: document.getElementById("auth-status"),
  authSwitch: document.getElementById("auth-switch"),
  registerForm: document.getElementById("register-form"),
  registerUsername: document.getElementById("register-username"),
  registerEmail: document.getElementById("register-email"),
  registerPassword: document.getElementById("register-password"),
  loginForm: document.getElementById("login-form"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  onboarding: document.getElementById("onboarding"),
  setupSteps: document.getElementById("setup-steps"),
  connectDemo: document.getElementById("connect-demo"),
  navList: document.getElementById("nav-list"),
  statusBadge: document.getElementById("status-badge"),
  userBadge: document.getElementById("user-badge"),
  logoutButton: document.getElementById("logout-button"),
  homeIntentSummary: document.getElementById("home-intent-summary"),
  homeKeywords: document.getElementById("home-keywords"),
  homeVisionTitle: document.getElementById("home-vision-title"),
  homeVision: document.getElementById("home-vision"),
  homeUnderstanding: document.getElementById("home-understanding"),
  homePreferences: document.getElementById("home-preferences"),
  graph: document.getElementById("graph"),
  mapFocus: document.getElementById("map-focus"),
  mapMemory: document.getElementById("map-memory"),
  distillList: document.getElementById("distill-list"),
  distillDetail: document.getElementById("distill-detail"),
  chatHistory: document.getElementById("chat-history"),
  toggleChatHistory: document.getElementById("toggle-chat-history"),
  newChat: document.getElementById("new-chat"),
  chatHistoryList: document.getElementById("chat-history-list"),
  chatMessages: document.getElementById("chat-messages"),
  chatForm: document.getElementById("chat-form"),
  chatInput: document.getElementById("chat-input"),
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
  refs.authSwitch.addEventListener("click", () => {
    setAuthMode(state.authMode === "login" ? "register" : "login");
  });

  refs.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await window.egoclawApp.register({
      username: refs.registerUsername.value,
      email: refs.registerEmail.value,
      password: refs.registerPassword.value
    });
    refs.registerPassword.value = "";
  });

  refs.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await window.egoclawApp.login({
      email: refs.loginEmail.value,
      password: refs.loginPassword.value
    });
    refs.loginPassword.value = "";
  });

  refs.connectDemo.addEventListener("click", () => window.egoclawApp.connectDemo());
  refs.logoutButton.addEventListener("click", () => window.egoclawApp.logout());
  const toggleHistory = () => {
    state.chatHistoryCollapsed = !state.chatHistoryCollapsed;
    renderDialogue();
  };
  refs.toggleChatHistory?.addEventListener("click", toggleHistory);
  refs.newChat?.addEventListener("click", () => window.egoclawApp.newChat());
  refs.goAction.addEventListener("click", async () => {
    await window.egoclawApp.petAction("start");
    await window.egoclawApp.setPage("dialogue");
  });
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

  refs.graph.addEventListener("pointerdown", (event) => {
    if (!state.snapshot?.graph?.nodes?.length) return;
    if (event.target.closest?.(".graph-node")) return;
    state.graphDrag = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY
    };
    refs.graph.setPointerCapture(event.pointerId);
    refs.graph.classList.add("is-dragging");
  });

  refs.graph.addEventListener("pointermove", (event) => {
    if (!state.graphDrag || state.graphDrag.pointerId !== event.pointerId) return;
    const rect = refs.graph.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dx = ((event.clientX - state.graphDrag.clientX) / rect.width) * state.graphViewport.width;
    const dy = ((event.clientY - state.graphDrag.clientY) / rect.height) * state.graphViewport.height;

    state.graphViewport.x -= dx;
    state.graphViewport.y -= dy;
    state.graphDrag.clientX = event.clientX;
    state.graphDrag.clientY = event.clientY;
    applyGraphViewport();
  });

  refs.graph.addEventListener("pointerup", endGraphDrag);
  refs.graph.addEventListener("pointercancel", endGraphDrag);
}

function render() {
  if (!state.snapshot) return;
  renderAuth();
  renderOnboarding();
  renderHeader();
  renderNav();
  renderHome();
  renderMap();
  renderDistill();
  renderDialogue();
  const visiblePage = normalizedPage();
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === visiblePage);
  });
}

function renderAuth() {
  const auth = state.snapshot.auth || { ready: false, error: "MySQL 未初始化", user: null };
  refs.authShell.classList.toggle("hidden", Boolean(auth.user));
  refs.loginForm.classList.toggle("hidden", state.authMode !== "login");
  refs.registerForm.classList.toggle("hidden", state.authMode !== "register");
  refs.authTitle.textContent = state.authMode === "login" ? "登录" : "注册";
  refs.authSwitch.textContent = state.authMode === "login" ? "还没注册？去注册" : "已有账号？去登录";

  const disabled = !auth.ready;
  [
    refs.registerUsername,
    refs.registerEmail,
    refs.registerPassword,
    refs.loginEmail,
    refs.loginPassword,
    refs.registerForm.querySelector('button[type="submit"]'),
    refs.loginForm.querySelector('button[type="submit"]')
  ].forEach((node) => {
    node.disabled = disabled;
  });

  refs.authStatus.textContent = auth.error || "";
}

function renderOnboarding() {
  const shouldHide = !state.snapshot.auth?.user || state.snapshot.connected;
  refs.onboarding.classList.toggle("hidden", shouldHide);
  refs.setupSteps.innerHTML = state.snapshot.setupSteps
    .map((step) => `<div class="setup-item"><strong>${step.title}</strong><span>${step.status === "done" ? "已完成" : step.status === "active" ? "进行中" : "等待中"}</span></div>`)
    .join("");
  refs.connectDemo.textContent = state.snapshot.processing ? "同步中" : "开始同步";
  refs.connectDemo.disabled = state.snapshot.processing || !state.snapshot.auth?.user;
}

function renderHeader() {
  refs.userBadge.textContent = state.snapshot.auth?.user?.username || "未登录";
  refs.statusBadge.textContent = !state.snapshot.connected ? "等待连接" : triggerLabel(state.snapshot.pet.lastTriggerId);
}

function renderNav() {
  const visiblePage = normalizedPage();
  refs.navList.innerHTML = `${NAV_ITEMS.map(([id, icon, label]) => `
    <button class="top-nav-item ${visiblePage === id ? "active" : ""}" data-page="${id}" type="button">
      <span class="top-nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
    </button>
  `).join("")}`;

  refs.navList.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.setPage(button.dataset.page));
  });
}

function renderHome() {
  const profile = deriveHomeProfile(state.snapshot);
  refs.homeIntentSummary.textContent = profile.summary;
  refs.homeVisionTitle.textContent = profile.visionTitle;
  refs.homeKeywords.innerHTML = profile.keywords.map((item) => `<span class="pill accent">${item}</span>`).join("");
  refs.homeVision.innerHTML = detailCard(profile.visionTitle, [
    ["画像总结", profile.visionBody],
    ["当前同步", profile.syncLine]
  ]);
  refs.homeUnderstanding.innerHTML = profile.understanding.map((item) => stackItem(item.title, item.body, "")).join("");
  refs.homePreferences.innerHTML = renderPreferenceGroups(state.snapshot.settings || {});
  refs.homePreferences.querySelectorAll("[data-pref-key][data-pref-value]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.setCompanionPreference(button.dataset.prefKey, button.dataset.prefValue));
  });
}

function renderMap() {
  renderGraph();
  const intent = currentIntent();
  refs.mapFocus.innerHTML = intent
    ? detailCard(intent.name, [
        ["Evidence", intent.reasons.join(" / ")],
        ["Support", `${intent.supportVideoIds.length} items`],
        ["Action", state.snapshot.planner?.action || "未生成"]
      ])
    : detailCard("尚未构建", [["Next", "同步后自动生成地图"]]);

  const memoryItems = [state.snapshot.soulMemory?.[0], state.snapshot.skillMemory?.[0]].filter(Boolean).map(normalizeMemoryItem);
  refs.mapMemory.innerHTML = memoryItems.length
    ? memoryItems.map((item) => stackItem(item.title, item.body, "")).join("")
    : stackItem("暂无沉淀", "等待生成。", "");
}

function renderDistill() {
  const visibleVideos = (state.snapshot.distilledVideos || []).slice(0, 2);
  const activeVisibleVideo = visibleVideos.find((video) => video.videoId === state.snapshot.activeVideoId) || visibleVideos[0] || null;

  refs.distillList.innerHTML = visibleVideos.length
    ? visibleVideos.map((video) => skillCard(video, activeVisibleVideo?.videoId === video.videoId)).join("")
    : `<div class="skill-card"><div class="skill-head"><span class="skill-category">Pending</span><span class="skill-meta">--</span></div><h3>等待同步</h3><p>同步收藏夹后这里会生成蒸馏结果。</p></div>`;

  refs.distillList.querySelectorAll("[data-video-id]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.selectVideo(button.dataset.videoId));
  });

  const video = activeVisibleVideo;
  refs.distillDetail.innerHTML = video
    ? detailCard(video.skill, [
        ["Topic", video.topic],
        ["Goal", video.goal],
        ["Action", video.action],
        ["Evidence", video.evidence.join(" / ")]
      ])
    : detailCard("暂无内容", [["Next", "先同步收藏夹"]]);
}

function renderDialogue() {
  const conversations = state.snapshot.chatConversations || [];
  const currentConversationId = state.snapshot.currentConversationId;
  const currentConversation = conversations.find((item) => item.id === currentConversationId) || conversations[0];
  refs.chatHistory?.classList.toggle("is-collapsed", state.chatHistoryCollapsed);
  refs.toggleChatHistory?.setAttribute("aria-label", state.chatHistoryCollapsed ? "展开历史记录" : "收起历史记录");
  const chevron = state.chatHistoryCollapsed ? "&gt;" : "&lt;";
  refs.toggleChatHistory.innerHTML = `<span class="chevron-mark">${chevron}</span>`;

  refs.chatHistoryList.innerHTML = conversations
    .map((item) => `<button class="chat-history-item ${item.id === currentConversation?.id ? "active" : ""}" data-chat-id="${item.id}" type="button">
      <strong>${item.title || "New Chat"}</strong>
      <span>${item.updatedAt || ""}</span>
    </button>`)
    .join("");
  refs.chatHistoryList.querySelectorAll("[data-chat-id]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.selectChat(button.dataset.chatId));
  });

  refs.chatMessages.innerHTML = (currentConversation?.messages || [])
    .map((message) => {
      const isUser = message.role === "user";
      return `<div class="chat-row ${message.role}">
        <div class="chat-avatar ${message.role}">${isUser ? "你" : ""}</div>
        <div class="chat-body">
          <div class="bubble ${message.role} ${message.pending ? "pending" : ""}">${renderMessageContent(message)}</div>
        </div>
      </div>`;
    })
    .join("");
  refs.chatMessages.scrollTop = refs.chatMessages.scrollHeight;
}

function renderGraph() {
  refs.graph.innerHTML = "";
  const nodes = state.snapshot.graph.nodes || [];
  const edges = state.snapshot.graph.edges || [];
  const layout = computeGraphLayout(nodes, edges);

  if (layout.key !== state.graphLayoutKey) {
    state.graphLayoutKey = layout.key;
    state.graphViewport = { ...GRAPH_VIEWBOX };
  }

  applyGraphViewport();

  layout.edges.forEach((edge) => {
    const from = layout.nodes.find((node) => node.id === edge.from);
    const to = layout.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("stroke", to.color || "#2D4BF0");
    line.setAttribute("stroke-opacity", "0.2");
    line.setAttribute("stroke-width", "1");
    refs.graph.appendChild(line);
  });

  layout.nodes.forEach((node) => {
    refs.graph.appendChild(createGraphNode(node));
  });
}

function markGraphNodeComplete(nodeId) {
  if (!nodeId) return;
  state.graphCompleted.add(nodeId);
  state.graphAnimating.add(nodeId);
  renderGraph();
  window.setTimeout(() => {
    state.graphAnimating.delete(nodeId);
    renderGraph();
  }, 900);
}

function applyGraphViewport() {
  refs.graph.setAttribute(
    "viewBox",
    `${state.graphViewport.x} ${state.graphViewport.y} ${state.graphViewport.width} ${state.graphViewport.height}`
  );
}

function currentIntent() {
  return state.snapshot?.intents?.find((item) => item.id === state.snapshot.activeIntentId) || null;
}

function normalizedPage() {
  const current = state.snapshot?.currentPage;
  if (NAV_ITEMS.some(([id]) => id === current)) return current;
  if (current === "action" || current === "sync" || current === "settings") return "home";
  return "home";
}

function currentVideo() {
  return state.snapshot?.distilledVideos?.find((item) => item.videoId === state.snapshot.activeVideoId) || state.snapshot?.distilledVideos?.[0] || null;
}

function triggerLabel(triggerId) {
  if (!state.snapshot.connected) return "等待连接";
  return {
    douyin_open: "抖音前台",
    resume_path: "路径重启",
    evening_window: "空闲窗口"
  }[triggerId] || "已同步";
}

function normalizeMemoryItem(item) {
  if (!item) return item;
  const title = String(item.title || "")
    .replace(/soul\.md\s*\/?\s*/gi, "")
    .replace(/skill\.md\s*\/?\s*/gi, "")
    .trim();
  return {
    ...item,
    title: title || "Archive Memory"
  };
}

function endGraphDrag(event) {
  if (!state.graphDrag || state.graphDrag.pointerId !== event.pointerId) return;
  refs.graph.releasePointerCapture(event.pointerId);
  refs.graph.classList.remove("is-dragging");
  state.graphDrag = null;
}

function computeGraphLayout(nodes, edges) {
  const intentNodes = nodes
    .filter((node) => node.type === "intent")
    .sort((left, right) => (left.order || 0) - (right.order || 0));
  const skillNodes = nodes
    .filter((node) => node.type === "skill")
    .sort((left, right) => (left.intentId || "").localeCompare(right.intentId || "") || (left.order || 0) - (right.order || 0));

  const growthMapPresets = [
    {
      x: 180,
      y: 180,
      size: 112,
      skillOffsets: [
        { x: -170, y: -145 },
        { x: 178, y: -110 },
        { x: 176, y: 82 },
        { x: -176, y: 110 }
      ]
    },
    {
      x: 615,
      y: 340,
      size: 102,
      skillOffsets: [
        { x: 176, y: -132 },
        { x: 212, y: 22 },
        { x: 144, y: 142 },
        { x: -72, y: -166 }
      ]
    },
    {
      x: 205,
      y: 410,
      size: 106,
      skillOffsets: [
        { x: 214, y: 58 },
        { x: 118, y: -148 },
        { x: 246, y: -54 },
        { x: 156, y: 136 }
      ]
    },
    {
      x: 650,
      y: 160,
      size: 104,
      skillOffsets: [
        { x: -186, y: -132 },
        { x: -226, y: 28 },
        { x: -148, y: 152 },
        { x: 112, y: -140 }
      ]
    }
  ];

  const positionedNodes = [];
  const positionedEdges = [];

  intentNodes.forEach((intent, index) => {
    const anchor = growthMapPresets[index] || getFallbackGrowthAnchor(index);
    const clusterSkills = skillNodes.filter((node) => node.intentId === intent.intentId);

    positionedNodes.push({
      ...intent,
      visualType: "intent",
      x: anchor.x,
      y: anchor.y,
      size: anchor.size,
      color: "#1A1A1A"
    });

    clusterSkills.forEach((skill, skillIndex) => {
      const offset = anchor.skillOffsets[skillIndex] || getFallbackSkillOffset(skillIndex, index);
      positionedNodes.push({
        ...skill,
        visualType: "skill",
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
        size: 84 - Math.min(skillIndex, 2) * 4,
        color: "#2D4BF0"
      });
      positionedEdges.push({
        from: intent.id,
        to: skill.id
      });
    });
  });

  if (!positionedEdges.length) {
    edges
      .filter((edge) => edge.type === "contains")
      .forEach((edge) => {
        if (positionedNodes.some((node) => node.id === edge.from) && positionedNodes.some((node) => node.id === edge.to)) {
          positionedEdges.push(edge);
        }
      });
  }

  return {
    key: positionedNodes.map((node) => node.id).join("|"),
    nodes: positionedNodes,
    edges: positionedEdges
  };
}

function getFallbackGrowthAnchor(index) {
  const fallbackAnchors = [
    { x: 240, y: 240, size: 96, skillOffsets: [{ x: -168, y: -118 }, { x: 168, y: -118 }, { x: 176, y: 68 }] },
    { x: 560, y: 240, size: 96, skillOffsets: [{ x: -168, y: -118 }, { x: 168, y: -118 }, { x: 176, y: 68 }] },
    { x: 240, y: 450, size: 96, skillOffsets: [{ x: 176, y: 68 }, { x: 112, y: -144 }, { x: 206, y: -84 }] },
    { x: 560, y: 450, size: 96, skillOffsets: [{ x: -176, y: 68 }, { x: -112, y: -144 }, { x: -206, y: -84 }] }
  ];

  return fallbackAnchors[index % fallbackAnchors.length];
}

function getFallbackSkillOffset(skillIndex, clusterIndex) {
  const angleSets = [
    [-0.9, 0.1, 1.1, 2.1],
    [-2.2, -1.2, -0.2, 0.8],
    [-0.4, -1.2, 0.6, 1.4],
    [-2.6, -1.8, -0.9, 0.2]
  ];
  const angle = angleSets[clusterIndex % angleSets.length][skillIndex % 4];
  const radius = 205 + Math.floor(skillIndex / 4) * 52;

  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius)
  };
}

function createGraphNode(node) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const body = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const primary = node.visualType === "intent";
  const size = node.size || (primary ? 108 : 84);
  const labelLines = wrapNodeLabel(node.label, primary ? 4 : 5, 2);
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");

  group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
  group.setAttribute("class", "graph-node");
  group.setAttribute("tabindex", "0");
  group.setAttribute("role", "button");
  group.setAttribute("aria-label", `${node.label}，点击标记完成`);
  body.setAttribute("class", "graph-node-body");

  if (state.graphCompleted.has(node.id)) {
    group.classList.add("is-complete");
  }
  if (state.graphAnimating.has(node.id)) {
    group.classList.add("is-completing");
  }

  rect.setAttribute("x", String(-size / 2));
  rect.setAttribute("y", String(-size / 2));
  rect.setAttribute("width", String(size));
  rect.setAttribute("height", String(size));
  rect.setAttribute("fill", node.color || (primary ? "#1A1A1A" : "#2D4BF0"));
  rect.setAttribute("fill-opacity", primary ? "1" : "0.05");
  rect.setAttribute("stroke", node.color || (primary ? "#1A1A1A" : "#2D4BF0"));
  rect.setAttribute("stroke-width", primary ? "1" : "1.4");
  body.appendChild(rect);

  appendNodeIcon(body, node, primary ? "#ffffff" : "#2f3d77");

  label.setAttribute("x", "0");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("font-size", primary ? "20" : "15");
  label.setAttribute("font-family", primary ? "\"Libre Baskerville\", serif" : "\"Noto Serif SC\", \"Libre Baskerville\", serif");
  label.setAttribute("font-style", "italic");
  label.setAttribute("fill", primary ? "#ffffff" : "#1a1a1a");

  labelLines.forEach((line, index) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.setAttribute("x", "0");
    tspan.setAttribute("y", String(primary ? 22 + index * 17 : 17 + index * 15));
    tspan.textContent = line;
    label.appendChild(tspan);
  });

  body.appendChild(label);
  group.appendChild(body);
  group.addEventListener("click", (event) => {
    event.stopPropagation();
    markGraphNodeComplete(node.id);
  });
  group.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    markGraphNodeComplete(node.id);
  });
  return group;
}

function appendNodeIcon(group, node, stroke) {
  const icon = resolveNodeIcon(node);
  const iconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  iconGroup.setAttribute("transform", `translate(0 ${node.visualType === "intent" ? -22 : -17})`);
  iconGroup.setAttribute("fill", "none");
  iconGroup.setAttribute("stroke", stroke);
  iconGroup.setAttribute("stroke-width", node.visualType === "intent" ? "2.2" : "1.8");
  iconGroup.setAttribute("stroke-linecap", "round");
  iconGroup.setAttribute("stroke-linejoin", "round");

  if (icon === "camera") {
    appendPath(iconGroup, "M -10 -3 h 20 a 2 2 0 0 1 2 2 v 10 a 2 2 0 0 1 -2 2 h -20 a 2 2 0 0 1 -2 -2 v -10 a 2 2 0 0 1 2 -2 z");
    appendPath(iconGroup, "M -4 -7 h 8");
    appendCircle(iconGroup, 0, 4, node.visualType === "intent" ? 4.5 : 3.8);
  } else if (icon === "bolt") {
    appendPath(iconGroup, "M -4 -10 L 4 -10 L -1 -1 L 6 -1 L -6 12 L -1 2 L -7 2 Z");
  } else if (icon === "bowl") {
    appendPath(iconGroup, "M -10 -1 H 10");
    appendPath(iconGroup, "M -8 -1 C -7 7 -4 11 0 11 C 4 11 7 7 8 -1");
    appendPath(iconGroup, "M -3 -7 C -1 -10 1 -10 3 -7");
  } else if (icon === "bulb") {
    appendPath(iconGroup, "M 0 -10 a 7 7 0 0 1 5.6 11.2 c -1.1 1.4 -1.7 2.4 -1.8 3.8 h -7.6 c -0.1 -1.4 -0.7 -2.4 -1.8 -3.8 A 7 7 0 0 1 0 -10");
    appendPath(iconGroup, "M -3 8 h 6");
    appendPath(iconGroup, "M -2 11 h 4");
  } else {
    appendPath(iconGroup, "M -11 -8 v 16");
    appendPath(iconGroup, "M 11 -8 v 16");
    appendPath(iconGroup, "M -11 -8 C -5 -6 -3 -4 0 0 C 3 -4 5 -6 11 -8");
    appendPath(iconGroup, "M -11 8 C -5 6 -3 4 0 0 C 3 4 5 6 11 8");
    appendPath(iconGroup, "M 0 -2 v 6");
  }

  group.appendChild(iconGroup);
}

function resolveNodeIcon(node) {
  if (node.visualType === "skill") return "bulb";

  if (/摄|构图/.test(node.label)) return "camera";
  if (/PPT|AI|大纲/.test(node.label)) return "bolt";
  if (/早餐|燕麦|减脂/.test(node.label)) return "bowl";
  return "book";
}

function appendPath(group, d) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  group.appendChild(path);
}

function appendCircle(group, cx, cy, r) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", String(cx));
  circle.setAttribute("cy", String(cy));
  circle.setAttribute("r", String(r));
  group.appendChild(circle);
}

function wrapNodeLabel(label, lineLength, maxLines) {
  const compact = String(label || "")
    .replace(/\s+/g, "")
    .replace(/。$/, "");
  if (!compact) return ["未命名"];

  const lines = [];
  for (let index = 0; index < compact.length && lines.length < maxLines; index += lineLength) {
    lines.push(compact.slice(index, index + lineLength));
  }

  if (compact.length > lineLength * maxLines) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, lineLength - 1))}…`;
  }

  return lines;
}

function detailCard(title, rows) {
  return `<div class="detail-card">
    <strong>${title}</strong>
    <div class="kv-list">${rows.map(([key, value]) => `<div class="kv-row"><strong>${key}</strong><span>${value}</span></div>`).join("")}</div>
  </div>`;
}

function stackItem(title, body, time) {
  return `<div class="stack-item">
    <div class="item-topline"><span>${title}</span><span>${time || ""}</span></div>
    <p>${body}</p>
  </div>`;
}

function skillCard(video, active) {
  return `<button class="skill-card ${active ? "active" : ""}" data-video-id="${video.videoId}" type="button">
    <div class="skill-head">
      <span class="skill-category">${video.topic}</span>
      <span class="skill-meta">${video.stage}</span>
    </div>
    <h3>${video.skill}</h3>
    <p>${video.goal}</p>
    <div class="skill-footer">
      <span>${video.evidence.length} signals</span>
      <span>${video.action}</span>
    </div>
  </button>`;
}

function deriveHomeProfile(snapshot) {
  const intents = snapshot.intents || [];
  const topIntents = intents.slice(0, 3);
  const keywords = topIntents.length ? topIntents.map((item) => simplifyIntentLabel(item.name)) : ["表达力", "行动力", "长期主义"];
  const visionTitle = keywords.length >= 3 ? `更会${keywords[0]}、更能${keywords[1]}、更稳地靠近${keywords[2]}` : "更像三年后的自己";
  const summary = snapshot.connected
    ? "灵宝会根据你的收藏、路径变化和完成记录，持续更新对你的理解。你也可以反过来定义它的性格、提醒方式和陪伴风格。"
    : "先完成一次同步，灵宝会从你的收藏中提炼出长期画像和陪伴偏好。";
  const visionBody = topIntents.length
    ? `从最近的收藏和反复出现的路径来看，你真正反复靠近的不是单个技巧，而是 ${keywords.join("、")} 这些会长期塑造你的能力。`
    : "目前还没有足够的收藏样本来形成稳定的三年画像。";
  const syncLine = snapshot.connected
    ? `已同步 ${snapshot.archive?.length || 0} 条收藏样本，当前图谱包含 ${snapshot.graph?.nodes?.length || 0} 个节点。`
    : "当前还没有同步记录。";
  const latestNudge = snapshot.nudgeHistory?.[0];
  const understanding = [
    {
      title: "当前高频主题",
      body: topIntents.length ? topIntents.map((item) => `${item.name}（${item.score}）`).join(" / ") : "等待同步后识别。"
    },
    {
      title: "当前主路径",
      body: topIntents[0]?.reasons?.[0] || "等待同步后生成。"
    },
    {
      title: "最近动作建议",
      body: snapshot.planner?.action || "等待同步后生成。"
    },
    {
      title: "最近一次提醒",
      body: latestNudge ? `${latestNudge.title} / ${latestNudge.time}` : "暂时没有提醒记录。"
    }
  ];
  return { summary, keywords, visionTitle, visionBody, syncLine, understanding };
}

function simplifyIntentLabel(label) {
  return String(label || "")
    .replace(/^开始/, "")
    .replace(/^准备/, "")
    .replace(/练习/g, "")
    .replace(/\s+/g, "")
    .slice(0, 6) || "热爱";
}

function renderPreferenceGroups(settings) {
  const groups = [
    {
      key: "personalityTone",
      title: "说话风格",
      options: [
        ["direct", "直接克制"],
        ["gentle", "温柔陪伴"],
        ["coach", "像教练推进"],
        ["buddy", "像搭子聊天"]
      ]
    },
    {
      key: "reminderStyle",
      title: "提醒方式",
      options: [
        ["contextual", "关键时刻出现"],
        ["daily", "每天轻提醒"],
        ["proactive", "遇场景主动提醒"]
      ]
    },
    {
      key: "planningStyle",
      title: "行动拆解",
      options: [
        ["tiny_step", "先给最小一步"],
        ["full_path", "先给完整路径"],
        ["why_first", "先解释为什么"]
      ]
    },
    {
      key: "companionMode",
      title: "人格偏向",
      options: [
        ["calm", "冷静理性"],
        ["warm", "热情鼓励"],
        ["sharp", "锋利一点"],
        ["partner", "长期伙伴"]
      ]
    }
  ];

  return groups
    .map(
      (group) => `<div class="preference-group">
        <div class="preference-title">${group.title}</div>
        <div class="preference-options">
          ${group.options
            .map(
              ([value, label]) => `<button class="preference-option ${settings[group.key] === value ? "active" : ""}" data-pref-key="${group.key}" data-pref-value="${value}" type="button">${label}</button>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMessageContent(message) {
  if (message.role === "user") {
    return escapeHtml(message.text);
  }
  return renderMarkdown(message.text || "");
}

function renderMarkdown(markdown) {
  const escaped = escapeHtml(markdown);
  const blocks = escaped.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks
    .map((block) => {
      if (/^[-*]\s+/m.test(block)) {
        const items = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => line.replace(/^[-*]\s+/, ""));
        return `<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`;
      }

      if (/^\d+\.\s+/m.test(block)) {
        const items = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => line.replace(/^\d+\.\s+/, ""));
        return `<ol>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ol>`;
      }

      if (block.startsWith("&gt;")) {
        const quote = block
          .split("\n")
          .map((line) => line.replace(/^&gt;\s?/, ""))
          .join("<br />");
        return `<blockquote>${renderInlineMarkdown(quote)}</blockquote>`;
      }

      return `<p>${renderInlineMarkdown(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function renderInlineMarkdown(text) {
  return String(text || "")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function setAuthMode(mode) {
  state.authMode = mode;
  renderAuth();
}
