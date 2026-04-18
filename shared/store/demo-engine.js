import { EventEmitter } from "node:events";
import { mockArchive } from "../mock/archive.js";
import { triggerScenarios } from "../mock/triggers.js";
import { nowDateLabel, nowTimeLabel } from "../utils/time.js";
import { runIngestionAgent } from "../../agents/ingestion-agent.js";
import { runDistillAgent } from "../../agents/distill-agent.js";
import { runIntentAgent } from "../../agents/intent-agent.js";
import { runGraphAgent } from "../../agents/graph-agent.js";
import { runPlannerAgent } from "../../agents/planner-agent.js";
import { runNudgeAgent } from "../../agents/nudge-agent.js";
import { runMemoryAgent } from "../../agents/memory-agent.js";
import { runKimiChat } from "../../agents/client/kimi.js";
import { loadEnv } from "../utils/env.js";

const AGENT_IDS = ["ingestion", "distill", "intent", "graph", "planner", "nudge", "memory"];

function createConversation(title = "New Chat") {
  return {
    id: `chat_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    title,
    updatedAt: nowTimeLabel(),
    messages: [
      {
        role: "assistant",
        text: "我会先读懂你收藏过什么，再决定怎么接住你。"
      }
    ]
  };
}

function makeSetupSteps() {
  return [
    { id: "connect", title: "连接收藏样本", desc: "建立 Demo 收藏夹输入。", status: "pending" },
    { id: "distill", title: "蒸馏 skill", desc: "把视频转成 topic / skill / action。", status: "pending" },
    { id: "graph", title: "构建知识图谱", desc: "建立路径与长期目标关系。", status: "pending" },
    { id: "pet", title: "初始化灵宝", desc: "生成桌宠第一条提醒。", status: "pending" }
  ];
}

function makeAgentState() {
  return AGENT_IDS.reduce((acc, id) => {
    acc[id] = { status: "pending", output: "尚未开始。" };
    return acc;
  }, {});
}

function makeInitialState() {
  return {
    connected: false,
    processing: false,
    currentPage: "home",
    activeVideoId: null,
    activeIntentId: null,
    setupSteps: makeSetupSteps(),
    agentState: makeAgentState(),
    archive: [],
    distilledVideos: [],
    intents: [],
    graph: { nodes: [], edges: [] },
    system: {
      douyinForeground: false
    },
    planner: null,
    pet: {
      visible: false,
      collapsed: false,
      message: "主人，我先替你守着。只在有必要的时候出现。",
      meta: "等待路径升温或抖音前台触发。",
      priority: "idle",
      lastTriggerId: null
    },
    nudgeHistory: [],
    skillMemory: [],
    soulMemory: [],
    chatConversations: [createConversation()],
    currentConversationId: null,
    settings: {
      autoNudge: true,
      petPersistent: true,
      startupLaunch: true,
      animationEnabled: true,
      personalityTone: "direct",
      reminderStyle: "contextual",
      planningStyle: "tiny_step",
      companionMode: "partner"
    },
    logs: [{ title: "系统", body: "等待连接收藏夹样本。", time: nowTimeLabel() }]
  };
}

export class DemoEngine extends EventEmitter {
  constructor({ authService = null, authReady = false, authError = null } = {}) {
    super();
    this.state = makeInitialState();
    this.authService = authService;
    this.persistScheduled = false;
    this.state.auth = {
      ready: authReady,
      error: authError,
      user: null
    };
    this.state.currentConversationId = this.state.chatConversations[0].id;
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  emitUpdate() {
    this.emit("state", this.snapshot());
    this.schedulePersistUserState();
  }

  log(title, body) {
    this.state.logs.unshift({ title, body, time: nowTimeLabel() });
    this.state.logs = this.state.logs.slice(0, 24);
  }

  updateAgent(id, status, output) {
    this.state.agentState[id] = { status, output };
    this.emitUpdate();
  }

  async persistUserState() {
    if (!this.authService || !this.state.auth?.user?.id) return;
    await this.authService.saveUserState(this.state.auth.user.id, this.serializableUserState());
  }

  schedulePersistUserState() {
    if (this.persistScheduled || !this.authService || !this.state.auth?.user?.id) return;
    this.persistScheduled = true;
    queueMicrotask(async () => {
      this.persistScheduled = false;
      try {
        await this.persistUserState();
      } catch (error) {
        console.error("persistUserState failed", error);
      }
    });
  }

  serializableUserState() {
    return {
      connected: this.state.connected,
      currentPage: normalizedCurrentPage(this.state.currentPage),
      activeVideoId: this.state.activeVideoId,
      activeIntentId: this.state.activeIntentId,
      setupSteps: this.state.setupSteps,
      agentState: this.state.agentState,
      archive: this.state.archive,
      distilledVideos: this.state.distilledVideos,
      intents: this.state.intents,
      graph: this.state.graph,
      system: this.state.system,
      planner: this.state.planner,
      pet: this.state.pet,
      nudgeHistory: this.state.nudgeHistory,
      skillMemory: this.state.skillMemory,
      soulMemory: this.state.soulMemory,
      chatConversations: this.state.chatConversations,
      currentConversationId: this.state.currentConversationId,
      settings: this.state.settings,
      logs: this.state.logs
    };
  }

  restoreUserState(savedState) {
    if (!savedState) return;
    this.state.connected = Boolean(savedState.connected);
    this.state.processing = false;
    this.state.currentPage = normalizedCurrentPage(savedState.currentPage);
    this.state.activeVideoId = savedState.activeVideoId || null;
    this.state.activeIntentId = savedState.activeIntentId || null;
    this.state.setupSteps = savedState.setupSteps || makeSetupSteps();
    this.state.agentState = savedState.agentState || makeAgentState();
    this.state.archive = savedState.archive || [];
    this.state.distilledVideos = savedState.distilledVideos || [];
    this.state.intents = savedState.intents || [];
    this.state.graph = savedState.graph || { nodes: [], edges: [] };
    this.state.system = savedState.system || { douyinForeground: false };
    this.state.planner = savedState.planner || null;
    this.state.pet = savedState.pet || this.state.pet;
    this.state.nudgeHistory = savedState.nudgeHistory || [];
    this.state.skillMemory = savedState.skillMemory || [];
    this.state.soulMemory = savedState.soulMemory || [];
    const migratedConversations = savedState.chatConversations?.length
      ? savedState.chatConversations
      : [
          {
            ...createConversation("New Chat"),
            messages: savedState.chatMessages?.length ? savedState.chatMessages : createConversation().messages
          }
        ];
    this.state.chatConversations = migratedConversations;
    this.state.currentConversationId =
      savedState.currentConversationId && migratedConversations.some((item) => item.id === savedState.currentConversationId)
        ? savedState.currentConversationId
        : migratedConversations[0].id;
    this.state.settings = { ...this.state.settings, ...(savedState.settings || {}) };
    this.state.logs = savedState.logs?.length ? savedState.logs : this.state.logs;
  }

  async connectDemo() {
    if (!this.state.auth?.user) {
      this.log("认证", "用户未登录，不能进入 Demo 主链路。");
      this.emitUpdate();
      return this.snapshot();
    }
    if (this.state.processing) return this.snapshot();
    this.state.processing = true;
    this.state.setupSteps = makeSetupSteps();
    this.log("连接", "开始初始化 Demo 收藏夹和 Agent 管线。");
    this.emitUpdate();

    this.state.setupSteps[0].status = "active";
    this.emitUpdate();
    const archive = await runIngestionAgent(mockArchive);
    this.state.archive = archive;
    this.state.activeVideoId = archive[0]?.videoId || null;
    this.state.setupSteps[0].status = "done";
    this.updateAgent("ingestion", "done", `已读取 ${archive.length} 条收藏样本。`);

    this.state.setupSteps[1].status = "active";
    this.emitUpdate();
    const distilledVideos = [];
    for (const video of archive) {
      distilledVideos.push(await runDistillAgent(video));
    }
    this.state.distilledVideos = distilledVideos;
    this.state.setupSteps[1].status = "done";
    this.updateAgent("distill", "done", `已蒸馏 ${distilledVideos.length} 条视频为结构化 skill。`);

    this.state.setupSteps[2].status = "active";
    this.updateAgent("intent", "active", "正在识别当前最强意图。");
    const intentResult = await runIntentAgent(distilledVideos);
    this.state.intents = intentResult.intents;
    this.state.activeIntentId = intentResult.currentIntentId;
    this.updateAgent("intent", "done", `当前主意图：${this.currentIntent()?.name || "未识别"}`);

    const graph = await runGraphAgent(distilledVideos, intentResult);
    this.state.graph = graph;
    this.updateAgent("graph", "done", `图谱节点 ${graph.nodes.length} 个，关系 ${graph.edges.length} 条。`);

    const planner = await runPlannerAgent(this.currentIntent(), this.currentSupportVideos());
    this.state.planner = planner;
    this.updateAgent("planner", "done", `当前动作：${planner.action}`);

    const initialTrigger = triggerScenarios.evening_window;
    const nudge = await runNudgeAgent(this.currentIntent(), planner, initialTrigger);
    this.state.pet.visible = true;
    this.state.pet.message = nudge.message;
    this.state.pet.meta = nudge.meta;
    this.state.pet.priority = nudge.priority;
    this.state.pet.lastTriggerId = initialTrigger.id;
    this.state.nudgeHistory.unshift({
      title: "初始化提醒",
      body: nudge.message,
      time: nowTimeLabel()
    });
    this.updateAgent("nudge", "done", "已生成第一条桌宠提醒。");

    const memory = await runMemoryAgent(this.currentIntent(), planner);
    this.state.skillMemory = [memory.skillMd];
    this.state.soulMemory = [memory.soulMd];
    this.updateAgent("memory", "done", "已写入 skill.md 与 soul.md。");
    this.state.setupSteps[2].status = "done";
    this.state.setupSteps[3].status = "done";

    this.state.connected = true;
    this.state.processing = false;
    this.log("初始化完成", "收藏蒸馏、图谱、动作和灵宝提醒已全部就绪。");
    this.emitUpdate();
    return this.snapshot();
  }

  async register(payload) {
    if (!this.authService) {
      this.state.auth.error = "MySQL 未初始化";
      this.emitUpdate();
      return this.snapshot();
    }
    try {
      const user = await this.authService.register(payload);
      this.state.auth.user = user;
      this.state.auth.error = null;
      const savedState = await this.authService.loadUserState(user.id);
      if (savedState) {
        this.restoreUserState(savedState);
        if (needsReconnect(savedState)) {
          return this.connectDemo();
        }
      }
      this.log("认证", `注册成功并已登录：${user.username}`);
    } catch (error) {
      this.state.auth.error = error.message;
      this.log("认证失败", error.message);
    }
    this.emitUpdate();
    return this.snapshot();
  }

  async login(payload) {
    if (!this.authService) {
      this.state.auth.error = "MySQL 未初始化";
      this.emitUpdate();
      return this.snapshot();
    }
    try {
      const user = await this.authService.login(payload);
      this.state.auth.user = user;
      this.state.auth.error = null;
      const savedState = await this.authService.loadUserState(user.id);
      if (savedState) {
        this.restoreUserState(savedState);
        if (needsReconnect(savedState)) {
          return this.connectDemo();
        }
      }
      this.log("认证", `登录成功：${user.username}`);
    } catch (error) {
      this.state.auth.error = error.message;
      this.log("认证失败", error.message);
    }
    this.emitUpdate();
    return this.snapshot();
  }

  logout() {
    this.state.auth.user = null;
    this.state.auth.error = null;
    this.state.connected = false;
    this.state.processing = false;
    this.state.currentPage = "home";
    this.state.archive = [];
    this.state.distilledVideos = [];
    this.state.intents = [];
    this.state.graph = { nodes: [], edges: [] };
    this.state.planner = null;
    this.state.activeVideoId = null;
    this.state.activeIntentId = null;
    this.state.nudgeHistory = [];
    this.state.skillMemory = [];
    this.state.soulMemory = [];
    this.state.chatConversations = [createConversation()];
    this.state.currentConversationId = this.state.chatConversations[0].id;
    this.state.setupSteps = makeSetupSteps();
    this.state.agentState = makeAgentState();
    this.state.pet = {
      visible: false,
      collapsed: false,
      message: "主人，我先替你守着。只在有必要的时候出现。",
      meta: "等待路径升温或抖音前台触发。",
      priority: "idle",
      lastTriggerId: null
    };
    this.log("认证", "用户已退出登录。");
    this.emitUpdate();
    return this.snapshot();
  }

  async rerunPipeline() {
    if (!this.state.connected) return this.connectDemo();
    this.state.processing = true;
    this.log("重跑 Agent", "开始重新刷新当前路径与提醒。");
    this.emitUpdate();

    const distilledVideos = [];
    this.updateAgent("distill", "active", "重新蒸馏收藏内容。");
    for (const video of this.state.archive) {
      distilledVideos.push(await runDistillAgent(video));
    }
    this.state.distilledVideos = distilledVideos;
    this.updateAgent("distill", "done", `重新蒸馏完成，共 ${distilledVideos.length} 条。`);

    this.updateAgent("intent", "active", "重新判断当前最强意图。");
    const intentResult = await runIntentAgent(distilledVideos);
    this.state.intents = intentResult.intents;
    this.state.activeIntentId = intentResult.currentIntentId;
    this.updateAgent("intent", "done", `当前主意图：${this.currentIntent()?.name || "未识别"}`);

    this.updateAgent("graph", "active", "重建当前知识图谱。");
    this.state.graph = await runGraphAgent(distilledVideos, intentResult);
    this.updateAgent("graph", "done", "知识图谱已刷新。");

    this.updateAgent("planner", "active", "重算当前动作。");
    this.state.planner = await runPlannerAgent(this.currentIntent(), this.currentSupportVideos());
    this.updateAgent("planner", "done", `当前动作：${this.state.planner.action}`);

    this.state.processing = false;
    this.log("重跑完成", "当前路径、图谱与动作已刷新。");
    this.emitUpdate();
    return this.snapshot();
  }

  currentIntent() {
    return this.state.intents.find((item) => item.id === this.state.activeIntentId) || null;
  }

  currentSupportVideos() {
    const intent = this.currentIntent();
    if (!intent) return [];
    return this.state.distilledVideos.filter((video) => intent.supportVideoIds.includes(video.videoId));
  }

  currentRawVideo() {
    return this.state.distilledVideos.find((video) => video.videoId === this.state.activeVideoId) || this.state.distilledVideos[0] || null;
  }

  setPage(page) {
    this.state.currentPage = page;
    this.emitUpdate();
  }

  selectVideo(videoId) {
    this.state.activeVideoId = videoId;
    this.emitUpdate();
  }

  newConversation() {
    const conversation = createConversation();
    this.state.chatConversations.unshift(conversation);
    this.state.chatConversations = this.state.chatConversations.slice(0, 30);
    this.state.currentConversationId = conversation.id;
    this.state.currentPage = "dialogue";
    this.emitUpdate();
    return this.snapshot();
  }

  selectConversation(conversationId) {
    if (!this.state.chatConversations.some((item) => item.id === conversationId)) {
      return this.snapshot();
    }
    this.state.currentConversationId = conversationId;
    this.state.currentPage = "dialogue";
    this.emitUpdate();
    return this.snapshot();
  }

  async triggerScenario(triggerId) {
    if (!this.state.connected) return;
    const trigger = triggerScenarios[triggerId];
    if (!trigger) return;

    if (triggerId === "douyin_open") {
      const pptIntent = this.state.intents.find((item) => item.id === "ppt");
      if (pptIntent) this.state.activeIntentId = pptIntent.id;
    }
    if (triggerId === "resume_path") {
      const expressionIntent = this.state.intents.find((item) => item.id === "expression");
      if (expressionIntent) this.state.activeIntentId = expressionIntent.id;
    }

    this.state.planner = await runPlannerAgent(this.currentIntent(), this.currentSupportVideos());
    const nudge = await runNudgeAgent(this.currentIntent(), this.state.planner, trigger);
    this.state.pet.visible = true;
    this.state.pet.message = nudge.message;
    this.state.pet.meta = nudge.meta;
    this.state.pet.priority = nudge.priority;
    this.state.pet.lastTriggerId = trigger.id;
    this.state.nudgeHistory.unshift({
      title: trigger.title,
      body: nudge.message,
      time: nowTimeLabel()
    });
    this.state.nudgeHistory = this.state.nudgeHistory.slice(0, 8);
    this.log("触发提醒", `${trigger.title} -> ${this.currentIntent()?.name || "未识别"}`);
    this.emitUpdate();
  }

  async handlePetAction(action) {
    if (!this.state.connected) return;

    if (action === "start") {
      this.state.currentPage = "action";
      this.state.pet.message = "好，我们现在就开始。我已经把第一步拆轻了。";
      this.state.pet.meta = "已跳转到当前行动页。";
      this.log("桌宠", "用户通过灵宝进入当前行动页。");
    } else if (action === "map") {
      this.state.currentPage = "map";
      this.state.pet.message = "我已经把这条路径整理成图谱了。";
      this.state.pet.meta = "已跳转到成长地图页。";
      this.log("桌宠", "用户通过灵宝进入成长地图页。");
    } else if (action === "snooze") {
      this.state.pet.message = "好，那我先替你记着，等更合适的时候再叫你。";
      this.state.pet.meta = "本次提醒已延后。";
      this.log("桌宠", "用户选择晚点提醒。");
    } else if (action === "dismiss") {
      this.state.pet.message = "收到，这次不是这个方向。我会继续根据你的收藏变化重新判断。";
      this.state.pet.meta = "系统等待新的上下文。";
      this.log("桌宠", "用户反馈这次提醒不合适。");
    }

    this.emitUpdate();
  }

  async toggleSetting(key) {
    this.state.settings[key] = !this.state.settings[key];
    this.log("设置", `${key} -> ${this.state.settings[key] ? "on" : "off"}`);
    this.emitUpdate();
  }

  setForegroundState(isOpen) {
    if (this.state.system.douyinForeground === Boolean(isOpen)) {
      return this.snapshot();
    }
    this.state.system.douyinForeground = Boolean(isOpen);
    this.emitUpdate();
    return this.snapshot();
  }

  async setCompanionPreference(key, value) {
    const allowed = {
      personalityTone: ["direct", "gentle", "coach", "buddy"],
      reminderStyle: ["contextual", "daily", "proactive"],
      planningStyle: ["tiny_step", "full_path", "why_first"],
      companionMode: ["calm", "warm", "sharp", "partner"]
    };
    if (!allowed[key]?.includes(value)) return this.snapshot();
    this.state.settings[key] = value;
    this.log("灵宝设定", `${key} -> ${value}`);
    this.emitUpdate();
    return this.snapshot();
  }

  async toggleChecklistStep(index) {
    if (!this.state.planner) return;
    const intentId = this.currentIntent()?.id;
    if (!intentId) return;
    const planner = { ...this.state.planner };
    planner.steps = planner.steps.map((step, stepIndex) => ({
      ...step,
      done: stepIndex === index ? !step.done : step.done
    }));
    this.state.planner = planner;

    if (planner.steps.every((step) => step.done)) {
      this.state.soulMemory.unshift({
        title: "soul.md / 新的陪伴经验",
        body: `用户刚刚完成了「${planner.action}」。这次有效的接法是：先压低动作门槛，再由灵宝轻推开始。`
      });
      this.state.soulMemory = this.state.soulMemory.slice(0, 6);
      this.log("记忆", `已把「${planner.action}」的完成经验写入 soul.md。`);
    } else {
      this.log("动作", `更新步骤状态：${planner.steps[index].title}`);
    }

    this.emitUpdate();
  }

  async sendChat(question) {
    const intent = this.currentIntent();
    let conversation = this.currentConversation();
    if (!conversation) {
      this.newConversation();
      conversation = this.currentConversation();
    }
    conversation.messages.push({ role: "user", text: question });
    if (conversation.title === "New Chat") {
      conversation.title = makeConversationTitle(question);
    }
    conversation.updatedAt = nowTimeLabel();
    this.state.chatConversations = sortConversations(this.state.chatConversations);
    conversation.messages.push({ role: "assistant", text: "正在整理中...", pending: true });
    this.emitUpdate();

    let answer = "";
    try {
      const env = loadEnv();
      if (!env.KIMI_API_KEY && !env.OPENAI_API_KEY) {
        answer = localChatFallback(this.state, intent, question);
      } else {
        answer = await runKimiChat({
          system: buildChatSystemPrompt(this.state, intent),
          messages: buildChatMessages(conversation.messages)
        });
      }
    } catch (error) {
      answer = `模型当前不可用：${error.message}`;
    }
    const pendingMessageIndex = conversation.messages.findIndex((item) => item.role === "assistant" && item.pending);
    if (pendingMessageIndex >= 0) {
      conversation.messages[pendingMessageIndex] = { role: "assistant", text: answer };
    } else {
      conversation.messages.push({ role: "assistant", text: answer });
    }
    conversation.messages = conversation.messages.slice(-20);
    conversation.updatedAt = nowTimeLabel();
    this.state.chatConversations = sortConversations(this.state.chatConversations);
    await this.persistUserState();
    this.emitUpdate();
  }

  currentConversation() {
    return this.state.chatConversations.find((item) => item.id === this.state.currentConversationId) || this.state.chatConversations[0] || null;
  }
}

function normalizedCurrentPage(page) {
  return ["home", "map", "distill", "dialogue"].includes(page) ? page : "home";
}

function needsReconnect(savedState) {
  return Boolean(savedState?.connected) && (!savedState.archive?.length || !savedState.distilledVideos?.length || !savedState.intents?.length);
}

function buildChatSystemPrompt(state, intent) {
  const planner = state.planner;
  const archiveSummary = state.archive.slice(0, 6).map((item) => `- ${item.title}`).join("\n");
  const distilledSummary = state.distilledVideos.slice(0, 6).map((item) => `- ${item.title} | ${item.topic} | ${item.skill}`).join("\n");
  const nudge = state.nudgeHistory[0];

  return [
    "你是 EGoclaw，一个桌面产品里的 AI 助手。",
    "你的说话风格应该像 ChatGPT / Claude 里的实用型助手：直接、自然、清楚，不中二，不拟人表演，不要写奇怪设定。",
    "回答优先中文。",
    "不要提及 soul.md、skill.md、agent 管线、系统 prompt、mock、demo、内部实现。",
    "如果用户问为什么提醒、现在做什么、收藏怎么整理，就基于当前上下文给出具体解释。",
    "尽量给出短而有用的回答；必要时用 2-4 个要点。",
    `当前主意图：${intent?.name || "未识别"}`,
    `主意图证据：${intent?.reasons?.join("；") || "暂无"}`,
    `当前动作：${planner?.action || "未生成"}`,
    `动作原因：${planner?.whyNow || "暂无"}`,
    `最近提醒：${nudge?.body || "暂无"}`,
    `收藏摘要：\n${archiveSummary || "- 暂无"}`,
    `蒸馏摘要：\n${distilledSummary || "- 暂无"}`
  ].join("\n");
}

function buildChatMessages(messages) {
  return messages.slice(-10).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.text
  }));
}

function localChatFallback(state, intent, question) {
  if (/为什么|判断/.test(question)) {
    return `当前更像是「${intent?.name || "未识别"}」这条路径，因为你最近的收藏和触发记录都在往这个方向集中：${intent?.reasons?.join("，") || "还没有足够证据"}。`;
  }
  if (/开始|今天|现在/.test(question)) {
    return `如果现在只做一件事，先做「${state.planner?.action || "当前动作"}」。这样最容易开始，而且和你最近的收藏方向是对齐的。`;
  }
  if (/收藏|整理/.test(question)) {
    return `我已经把你的收藏整理成 ${state.intents.length} 条主要路径。当前优先的是「${intent?.name || "未识别"}」，你可以继续问我某一条路径具体怎么开始。`;
  }
  return "我会结合你最近的收藏、当前意图和动作建议来回答。你也可以直接问我为什么提醒你，或者现在最该开始什么。";
}

function makeConversationTitle(question) {
  return String(question || "").replace(/\s+/g, " ").trim().slice(0, 24) || "New Chat";
}

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}
