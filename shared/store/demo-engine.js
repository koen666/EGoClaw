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

const AGENT_IDS = ["ingestion", "distill", "intent", "graph", "planner", "nudge", "memory"];

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
    chatMessages: [
      {
        role: "assistant",
        text: "我会先读懂你收藏过什么，再决定怎么接住你。"
      }
    ],
    settings: {
      autoNudge: true,
      petPersistent: true,
      startupLaunch: true,
      animationEnabled: true
    },
    logs: [{ title: "系统", body: "等待连接收藏夹样本。", time: nowTimeLabel() }]
  };
}

export class DemoEngine extends EventEmitter {
  constructor({ authService = null, authReady = false, authError = null } = {}) {
    super();
    this.state = makeInitialState();
    this.authService = authService;
    this.state.auth = {
      ready: authReady,
      error: authError,
      user: null
    };
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  emitUpdate() {
    this.emit("state", this.snapshot());
  }

  log(title, body) {
    this.state.logs.unshift({ title, body, time: nowTimeLabel() });
    this.state.logs = this.state.logs.slice(0, 24);
  }

  updateAgent(id, status, output) {
    this.state.agentState[id] = { status, output };
    this.emitUpdate();
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
    this.state.chatMessages = [
      {
        role: "assistant",
        text: "我会先读懂你收藏过什么，再决定怎么接住你。"
      }
    ];
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

  toggleSetting(key) {
    this.state.settings[key] = !this.state.settings[key];
    this.log("设置", `${key} -> ${this.state.settings[key] ? "on" : "off"}`);
    this.emitUpdate();
  }

  toggleChecklistStep(index) {
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

  sendChat(question) {
    const intent = this.currentIntent();
    this.state.chatMessages.push({ role: "user", text: question });
    let answer = "我会继续根据你的收藏和最近触发的路径来更新判断。";
    if (/为什么|判断/.test(question)) {
      answer = `因为当前最强意图是「${intent?.name || "未识别"}」。证据包括：${intent?.reasons?.join("，") || "暂无"}。`;
    } else if (/开始|今天/.test(question)) {
      answer = `如果现在只做一件事，我建议你先做「${this.state.planner?.action || "当前动作"}」。`;
    } else if (/收藏|整理/.test(question)) {
      answer = `我已经把你的收藏整理成 ${this.state.intents.length} 条主路径，并且为当前主路径生成了具体动作。`;
    } else if (/灵宝|陪伴|soul/.test(question)) {
      answer = this.state.soulMemory[0]?.body || "我会在和你一起完成更多小目标之后，慢慢长出更稳定的陪伴方式。";
    }
    this.state.chatMessages.push({ role: "assistant", text: answer });
    this.state.chatMessages = this.state.chatMessages.slice(-16);
    this.emitUpdate();
  }
}
