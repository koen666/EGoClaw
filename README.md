# EGoclaw

EGoclaw 现在是一个 Electron 桌面 Demo，分成两部分：

1. `desktop-app/` 主应用窗口
2. `pet-runtime/` 独立桌宠窗口

当前主应用已经接入本地 MySQL 登录注册。应用启动时会自动创建数据库和 `users` 表。

## 运行要求

1. Node.js 22+
2. npm 10+
3. 本地 MySQL
4. 本地图形桌面环境

## 环境配置

项目会按这个优先级读取配置：

1. 进程环境变量
2. 根目录 `.env.local`
3. 根目录 `.env`

当前仓库已经支持直接使用 `.env`。

如果你本地 MySQL 是 `root` 且没有密码，根目录 `.env` 保持下面这样即可：

```bash
KIMI_API_KEY=
KIMI_BASE_URL=https://api.moonshot.ai/v1
KIMI_MODEL=kimi-k2
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=egoclaw_demo
```

说明：

1. `MYSQL_DATABASE` 不需要手动建，应用启动时会自动创建
2. `users` 表不需要手动建，应用启动时会自动创建
3. 不要把真实 API Key 提交到仓库

## 安装依赖

```bash
npm install
```

## 启动前检查

```bash
npm run check
```

这会检查主应用、桌宠、主进程和 smoke 脚本的 JS 语法。

## Smoke 验证

```bash
npm run smoke
```

这条命令会用本地 mock 登录态绕过 MySQL UI，直接验证主链路是否能产出：

1. 收藏夹同步
2. 意图识别
3. 行动规划
4. 灵宝提醒

## 启动桌面 App

```bash
npm start
```

启动后流程如下：

1. 打开主应用窗口
2. 打开独立桌宠窗口
3. 主进程尝试初始化 MySQL
4. 如果 MySQL 成功，首页先显示登录 / 注册
5. 注册或登录后，进入收藏夹 Demo 接入页
6. 点击 `连接 Demo 收藏夹` 后进入完整多 Agent 链路

## 当前主应用流程

1. 登录 / 注册
2. 连接 Demo 收藏夹
3. 同步中心查看样本和 Agent 状态
4. 成长地图查看图谱
5. 内容蒸馏查看 skill 化结果
6. 当前行动查看一步步拆解
7. 对话页查看系统解释

## MySQL 失败时

如果打开应用后登录页提示 MySQL 初始化失败，优先检查：

1. `mysql -u root` 是否能直接连上
2. `.env` 里的 `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` 是否正确
3. 当前 MySQL 是否允许该用户创建数据库

## 目录

```text
EGoClaw/
├── desktop-app/        # 主应用窗口
├── pet-runtime/        # 独立桌宠窗口
├── main-process/       # Electron 主进程、IPC、系统检测、MySQL 服务
├── agents/             # 多 Agent 逻辑
├── shared/             # mock 数据、状态、环境读取
├── assets/             # 静态资源
├── app.md
├── idea.md
├── TECHNICAL_PLAN.md
└── README.md
```

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
