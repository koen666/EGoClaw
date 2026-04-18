const NAV_ITEMS = [
  ["home", "⌂", "Logbook"],
  ["map", "◫", "Cartography"],
  ["distill", "✦", "Distill"],
  ["dialogue", "◌", "Dialogue"]
];

const state = {
  snapshot: null,
  authMode: "login",
  chatHistoryCollapsed: false,
  graphViewport: {
    x: 0,
    y: 0,
    width: 1000,
    height: 520
  },
  graphDrag: null
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
  homeIntentTitle: document.getElementById("home-intent-title"),
  homeIntentSummary: document.getElementById("home-intent-summary"),
  homeAction: document.getElementById("home-action"),
  homeIntentList: document.getElementById("home-intent-list"),
  homeNudgeHistory: document.getElementById("home-nudge-history"),
  homeStatFocus: document.getElementById("home-stat-focus"),
  homeStatNodes: document.getElementById("home-stat-nodes"),
  homeStatTrigger: document.getElementById("home-stat-trigger"),
  homeStatSync: document.getElementById("home-stat-sync"),
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

  document.querySelectorAll(".quick-question").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.sendChat(button.dataset.question));
  });

  refs.graph.addEventListener("pointerdown", (event) => {
    if (!state.snapshot?.graph?.nodes?.length) return;
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
  const intent = currentIntent();
  const planner = state.snapshot.planner;
  const latestNudge = state.snapshot.nudgeHistory[0];

  refs.homeIntentTitle.textContent = intent ? `${intent.name}.` : "Waiting.";
  refs.homeIntentSummary.textContent = intent
    ? `我已经把你最近收藏里的这条路径提取出来了。${intent.reasons[0] || ""}`
    : "先同步收藏夹，然后我会把当前最强意图整理出来。";

  refs.homeAction.innerHTML = planner
    ? detailCard(planner.action, [
        ["Why now", planner.whyNow],
        ["Duration", `${planner.estimatedMinutes} 分钟`]
      ])
    : detailCard("尚未生成", [["Next", "同步收藏夹后生成当前动作"]]);

  refs.homeIntentList.innerHTML = state.snapshot.intents.length
    ? state.snapshot.intents.slice(0, 3).map((item) => stackItem(item.name, item.reasons[0] || "", `${item.score}`)).join("")
    : stackItem("暂无路径", "等待同步。", "");

  refs.homeNudgeHistory.innerHTML = latestNudge
    ? stackItem(latestNudge.title, latestNudge.body, latestNudge.time)
    : stackItem("暂无提醒", "等待上下文触发。", "");

  refs.homeStatFocus.textContent = intent?.name || "Not Ready";
  refs.homeStatNodes.textContent = `${state.snapshot.graph.nodes?.length || 0} Nodes`;
  refs.homeStatTrigger.textContent = triggerLabel(state.snapshot.pet.lastTriggerId);
  refs.homeStatSync.textContent = state.snapshot.connected ? "Stable" : "Pending";
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
  refs.distillList.innerHTML = state.snapshot.distilledVideos.length
    ? state.snapshot.distilledVideos.map((video) => skillCard(video, state.snapshot.activeVideoId === video.videoId)).join("")
    : `<div class="skill-card"><div class="skill-head"><span class="skill-category">Pending</span><span class="skill-meta">--</span></div><h3>等待同步</h3><p>同步收藏夹后这里会生成蒸馏结果。</p></div>`;

  refs.distillList.querySelectorAll("[data-video-id]").forEach((button) => {
    button.addEventListener("click", () => window.egoclawApp.selectVideo(button.dataset.videoId));
  });

  const video = currentVideo();
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
  applyGraphViewport();
  const nodes = state.snapshot.graph.nodes || [];
  const edges = state.snapshot.graph.edges || [];

  const layout = {
    goal_self: { x: 500, y: 440 },
    intent_expression: { x: 220, y: 170 },
    intent_breakfast: { x: 470, y: 140 },
    intent_ppt: { x: 740, y: 170 },
    intent_photo: { x: 620, y: 360 }
  };

  const computedNodes = nodes.map((node, index) => {
    if (node.type === "goal") return { ...node, ...layout.goal_self };
    if (node.type === "intent") return { ...node, ...(layout[`intent_${node.intentId}`] || { x: 160 + index * 140, y: 160 }) };
    const root = layout[`intent_${node.intentId}`] || { x: 240, y: 260 };
    return {
      ...node,
      x: root.x + (node.type === "skill" ? -70 + (node.order || 0) * 130 : 0),
      y: root.y + (node.type === "skill" ? 120 : 220)
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
    line.setAttribute("stroke", "#1A1A1A");
    line.setAttribute("stroke-opacity", "0.18");
    line.setAttribute("stroke-width", "1");
    refs.graph.appendChild(line);
  });

  computedNodes.forEach((node) => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const primary = node.type === "goal" || node.type === "intent";
    const fill = primary ? "#1A1A1A" : "rgba(45,75,240,0.06)";
    const stroke = primary ? "#1A1A1A" : "#2D4BF0";
    const width = primary ? 132 : 112;
    const height = primary ? 72 : 56;
    rect.setAttribute("x", String(node.x - width / 2));
    rect.setAttribute("y", String(node.y - height / 2));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", fill);
    rect.setAttribute("stroke", stroke);
    rect.setAttribute("stroke-width", "1");
    refs.graph.appendChild(rect);

    text.setAttribute("x", String(node.x));
    text.setAttribute("y", String(node.y + 5));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", primary ? "15" : "13");
    text.setAttribute("font-family", "Libre Baskerville");
    text.setAttribute("font-style", "italic");
    text.setAttribute("fill", primary ? "#ffffff" : "#1A1A1A");
    text.textContent = node.label;
    refs.graph.appendChild(text);
  });
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
