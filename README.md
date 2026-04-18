# EGoclaw

## 项目定位

EGoclaw 是一个桌面 App，不是 Web 产品。

产品由两个独立部分组成：

1. 主应用窗口
2. 系统级桌宠灵宝

主应用窗口负责：

1. 展示收藏同步结果
2. 展示蒸馏结果
3. 展示知识图谱
4. 展示当前意图和下一步动作
5. 承接用户深度查看和执行

系统级桌宠灵宝负责：

1. 常驻桌面
2. 检测是否打开抖音
3. 在触发条件满足时从抖音窗口边缘跳出
4. 主动提醒用户
5. 点击后拉起主应用窗口

桌宠不属于主应用页面内部。
桌宠必须作为独立窗口存在。

---

## 当前代码状态

当前根目录的 `index.html` / `main.css` / `app.js` 只是一个临时单文件 Demo。

它的作用只有一个：

1. 快速验证产品流程

它不是最终目录结构，也不是最终实现方式。

后续代码必须拆分成桌面 App、桌宠窗口、Agent 服务、共享数据层四部分。

---

## 项目如何跑起来

### 1. 环境要求

需要本地具备：

1. Node.js 22+
2. npm 10+
3. 桌面图形环境

说明：

1. `npm run smoke` 不需要 GUI
2. `npm start` 需要本地桌面图形环境才能真正拉起 Electron 窗口

### 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 3. 配置 Kimi

推荐方式一：使用环境变量

```bash
export KIMI_API_KEY="你的 Kimi Key"
export KIMI_BASE_URL="https://api.moonshot.ai/v1"
export KIMI_MODEL="kimi-k2"
```

推荐方式二：使用 `.env.local`

先复制模板：

```bash
cp .env.example .env.local
```

然后把 `.env.local` 改成：

```bash
KIMI_API_KEY=你的_Kimi_Key
KIMI_BASE_URL=https://api.moonshot.ai/v1
KIMI_MODEL=kimi-k2
```

注意：

1. 不要把真实 key 提交到仓库
2. 当前 Agent 层支持没有 key 时的 fallback 逻辑
3. 没有 key 也能跑 Demo，但多智能体输出会退回本地规则结果

### 4. 先跑无界面检查

先执行：

```bash
npm run check
```

作用：

1. 检查主应用、桌宠、主进程和脚本入口的语法是否正确

### 5. 跑无 GUI 的 Demo smoke test

执行：

```bash
npm run smoke
```

预期结果：

1. 输出 `connected: true`
2. 输出 `current_intent`
3. 输出 `current_action`
4. 输出 `pet_message`

这说明：

1. 收藏样本已进入系统
2. Agent 管线已跑通
3. 当前意图、当前动作和桌宠提醒已经生成

### 6. 启动桌面 App

执行：

```bash
npm start
```

启动后会发生：

1. 打开主应用窗口
2. 打开桌宠独立窗口
3. 主进程开始轮询前台应用
4. 如果检测到抖音前台，会触发桌宠提醒逻辑

### 7. 当前 Demo 怎么操作

进入主应用后，建议按下面顺序验证：

1. 点击 `连接 Demo 收藏夹`
2. 等待收藏样本进入系统
3. 在首页查看当前主意图和当前动作
4. 在 `同步中心` 查看 Agent 处理链路
5. 在 `成长地图` 查看知识图谱
6. 在 `内容蒸馏` 查看视频如何被转成 skill
7. 点击顶部的：
   - `模拟打开抖音`
   - `模拟今晚空闲`
   - `模拟中断重启`
8. 观察桌宠窗口文案变化
9. 点击桌宠的：
   - `现在开始`
   - `查看路径`
   - `晚点提醒`
   - `不是这个`

### 8. 如果 `npm start` 起不来

常见原因：

1. 当前环境没有 GUI
2. 当前环境不允许 Electron 打开图形窗口
3. macOS 权限或沙箱限制导致 Electron 进程退出

遇到这种情况时：

1. 先跑 `npm run check`
2. 再跑 `npm run smoke`

只要这两个成功，说明：

1. 代码结构和 Agent 主链路是通的
2. 剩下的问题通常是本地 GUI 环境，不是业务逻辑本身

---

## 目标目录结构

建议后续重构为下面这套结构：

```text
EGoClaw/
├── README.md
├── idea.md
├── app.md
├── TECHNICAL_PLAN.md
├── assets/
│   └── lingbao-placeholder.svg
├── desktop-app/
│   ├── index.html
│   ├── main.css
│   ├── renderer/
│   │   ├── app.js
│   │   ├── pages/
│   │   │   ├── home.js
│   │   │   ├── sync.js
│   │   │   ├── map.js
│   │   │   ├── distill.js
│   │   │   ├── action.js
│   │   │   ├── dialogue.js
│   │   │   └── settings.js
│   │   ├── components/
│   │   └── store/
│   └── preload/
├── pet-runtime/
│   ├── pet.html
│   ├── pet.css
│   ├── pet.js
│   └── animations/
├── main-process/
│   ├── main.js
│   ├── windows/
│   │   ├── app-window.js
│   │   └── pet-window.js
│   ├── system/
│   │   ├── foreground-detector.js
│   │   ├── douyin-detector.js
│   │   └── tray.js
│   └── ipc/
├── agents/
│   ├── client/
│   │   └── kimi.js
│   ├── ingestion-agent.js
│   ├── distill-agent.js
│   ├── intent-agent.js
│   ├── graph-agent.js
│   ├── planner-agent.js
│   ├── nudge-agent.js
│   └── memory-agent.js
├── shared/
│   ├── mock/
│   ├── schemas/
│   ├── graph/
│   ├── store/
│   └── utils/
└── web/
```

说明：

1. `desktop-app/` 是主应用窗口
2. `pet-runtime/` 是桌宠独立窗口
3. `main-process/` 是桌面应用主进程和系统能力
4. `agents/` 是多智能体逻辑
5. `shared/` 是共享 schema、mock 数据、图谱和本地状态
6. `web/` 是旧代码，不作为当前主实现

---

## 每个部分要实现什么

## 1. `desktop-app/`

这是主应用窗口。

负责页面：

1. 首页总览
2. 同步中心
3. 成长地图
4. 内容蒸馏
5. 当前行动
6. 对话与解释
7. 设置

负责能力：

1. 展示用户当前主意图
2. 展示视频蒸馏结果
3. 展示 skill.md
4. 展示 soul.md
5. 展示知识图谱
6. 展示当前推荐动作
7. 接收桌宠点击后跳转

不负责：

1. 桌宠常驻
2. 系统级窗口检测
3. 从抖音边缘跳出动画

---

## 2. `pet-runtime/`

这是桌宠独立窗口。

必须是：

1. 独立窗口
2. 透明
3. 无边框
4. 常驻最前
5. 可移动

负责能力：

1. 待机状态显示灵宝
2. 检测到提醒任务后显示气泡
3. 支持“现在开始 / 晚点提醒 / 不是这个 / 打开主应用”
4. 播放从抖音窗口边缘跳出的动画

桌宠窗口不负责：

1. 直接做内容蒸馏
2. 直接做知识图谱计算
3. 直接做多 Agent 推理

桌宠只接收结果并表现出来。

---

## 3. `main-process/`

这是桌面应用主进程。

负责能力：

1. 启动主应用窗口
2. 启动桌宠窗口
3. 管理托盘
4. 管理开机启动
5. 检测前台应用
6. 判断是否打开抖音
7. 获取抖音窗口边界
8. 在桌宠和主应用之间分发事件

核心子模块：

### `windows/app-window.js`

负责：

1. 创建主应用窗口
2. 控制主窗口显示和隐藏

### `windows/pet-window.js`

负责：

1. 创建桌宠窗口
2. 控制桌宠位置
3. 控制桌宠显示隐藏
4. 触发边缘跳出动画

### `system/foreground-detector.js`

负责：

1. 获取当前前台应用
2. 获取前台窗口坐标

### `system/douyin-detector.js`

负责：

1. 判断当前前台应用是否为抖音
2. 返回抖音窗口位置给桌宠动画使用

### `ipc/`

负责：

1. 主窗口和桌宠窗口通信
2. 主进程和 Agent 层通信

---

## 4. `agents/`

这是多智能体部分。

当前建议全部通过 Node.js 封装，统一调用 Kimi API。

### 多智能体列表

#### `ingestion-agent.js`

负责：

1. 接收收藏内容
2. 标准化原始数据
3. 去重

输出：

1. 标准化视频对象

#### `distill-agent.js`

负责：

1. 把视频内容蒸馏成结构化 skill
2. 输出 topic、skill、goal、friction、action

输出：

1. `skill.md` 所需结构

#### `intent-agent.js`

负责：

1. 从多个 skill 中识别当前最强意图
2. 计算当前优先方向

输出：

1. 当前 Top Intent
2. 触发原因

#### `graph-agent.js`

负责：

1. 将视频、skill、action、goal 写入知识图谱

输出：

1. 图谱节点
2. 图谱边

#### `planner-agent.js`

负责：

1. 选出当前最值得开始的一步

输出：

1. 当前动作
2. why now
3. action steps

#### `nudge-agent.js`

负责：

1. 判断要不要提醒
2. 生成灵宝提醒文案
3. 输出提醒优先级

输出：

1. `nudge_ready`

#### `memory-agent.js`

负责：

1. 把单次经验写成 `skill.md`
2. 把长期陪伴经验写成 `soul.md`

输出：

1. 结构化陪伴记忆

---

## 5. `shared/`

这里放共享资产。

建议拆成：

### `shared/mock/`

负责：

1. Demo 收藏夹数据
2. Demo 触发场景数据

### `shared/schemas/`

负责：

1. 视频 schema
2. skill schema
3. intent schema
4. action schema
5. nudge schema

### `shared/graph/`

负责：

1. 图谱结构
2. 图谱关系定义

### `shared/store/`

负责：

1. 本地状态
2. 当前意图
3. 当前行动
4. 当前提醒

---

## Kimi API 接入

多智能体统一走 Kimi。

不要把 API key 直接写进代码或 README。

统一使用环境变量：

```bash
KIMI_API_KEY=your_key_here
KIMI_BASE_URL=https://api.moonshot.ai/v1
KIMI_MODEL=kimi-k2-0711-preview
```

说明：

1. `KIMI_API_KEY` 只放本地环境变量
2. `KIMI_BASE_URL` 使用 `https://api.moonshot.ai/v1`
3. `KIMI_MODEL` 后续按实际可用模型调整

建议封装在：

`agents/client/kimi.js`

这个文件负责：

1. 统一请求 Kimi
2. 统一设置 headers
3. 统一做超时、重试、错误处理
4. 给上层 Agent 返回结构化 JSON

---

## 当前推荐开发顺序

不要同时做全部。

先按下面顺序推进：

### 第一阶段

1. 搭建 `main-process/`
2. 搭建 `desktop-app/`
3. 搭建 `pet-runtime/`
4. 跑通主窗口和桌宠窗口

### 第二阶段

1. 实现 `foreground-detector.js`
2. 实现 `douyin-detector.js`
3. 跑通“打开抖音 -> 桌宠出现”

### 第三阶段

1. 接入 `agents/client/kimi.js`
2. 先实现 `distill-agent.js`
3. 再实现 `intent-agent.js`
4. 再实现 `planner-agent.js`

### 第四阶段

1. 做知识图谱展示
2. 做 `memory-agent.js`
3. 做 `skill.md` / `soul.md`

---

## 当前文件和后续命运

当前根目录这些文件：

1. `index.html`
2. `main.css`
3. `app.js`

它们只是一个临时 Demo 原型。

后续应拆分进入：

1. `desktop-app/`
2. `pet-runtime/`
3. `shared/`

`web/` 目录当前不作为主实现路径。

---

## 当前目标

当前不是继续堆页面。

当前目标是先把代码结构拆对：

1. 主应用窗口
2. 桌宠独立窗口
3. 主进程检测抖音
4. Agent 统一走 Kimi
5. 图谱和记忆走共享数据层

只有这样，后面再做界面、动画、交互才不会继续混乱。
