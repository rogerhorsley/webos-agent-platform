# NexusOS

> **你的 AI 工作操作系统** —— 把散落的智能能力，编织成一个可触摸的工作桌面。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 核心差异化

| 策略 | 说明 |
|------|------|
| **桌面即工作流** | 不是传统文件管理桌面，而是 Agent、任务、Skills 的可视化编排空间 |
| **人人可用的 Agent** | 图形化 Agent 管理，无需代码即可创建、组合、调度 AI Agent |
| **NexusCore 主助手** | 内置核心 Agent，理解用户意图后自动派活给专家 Agent 或 Team |
| **CLI + GUI 双模态** | 既有高效的命令行入口，也有直观的可视化画布，满足不同深度用户 |

## 目标用户

- **主要用户**: 知识工作者、创作者、独立开发者
- **次要用户**: 小型团队、AI 探索者

## 功能模块

### 桌面系统
- **智能桌面** - Widget 仪表盘：系统总览、Agent 状态、任务进度、实时动态
- **多窗口管理** - 支持窗口拖拽、缩放、最小化、最大化，Status Bar 和 Dock 常驻不被遮挡
- **Dock 栏** - 全宽吸底栏，左侧 App 启动器 + 右侧已打开窗口 Tray
- **壁纸系统** - 9 款内置弥散色彩壁纸，设置中切换，持久化到 localStorage

### NexusCore 主助手
- **意图识别** - 分析用户请求，决定直接回复、单 Agent 派活或 Team 协作派活
- **自动/确认模式** - 自动模式直接执行，确认模式先展示方案等用户批准
- **派活卡片** - Chat 中内嵌结构化派活卡片，显示目标、任务、执行状态

### Multi-Agent Team 协作
- **Agent 创建器** - 零代码配置自定义 Agent：定义角色、能力、模型参数
- **Team 管理** - 创建 Agent 团队，选择成员、协作模式、Coordinator
- **三种协作模式**：
  - **Sequential（顺序链式）** - Agent A 完成后交接给 Agent B
  - **Parallel（并行分发）** - 所有 Agent 同时执行，Coordinator 合并结果
  - **Hierarchical（层级指挥）** - Coordinator 分配子任务，Workers 执行，Coordinator 汇总
- **通信协议** - 混合模式：共享上下文（SharedContext）+ 结构化消息（AgentMessageBus）

### 任务管理
- **任务创建** - 支持指派给单个 Agent 或 Team
- **任务看板** - 看板视图追踪任务状态（待办/进行中/已完成）
- **Team 执行面板** - 实时时间线展示协作进度、各 Agent 步骤状态

### Chat 对话
- **多模态渲染** - Markdown、代码高亮、图片/视频/音频、URL 自动识别
- **代码块** - 语法高亮 50+ 语言，行号、复制、全屏展开
- **流式响应** - 实时 Token 推送，支持主动停止
- **附件上传** - 粘贴图片、拖拽文件、附件按钮

### 可视化画布
- **流程编排** - 拖拽式构建 Agent + Team + Skills 的工作流程图
- **节点类型** - Trigger、Agent、Agent Team、Condition、Tool、Output
- **工作流执行** - 拓扑排序遍历节点，支持 Agent 和 Team 节点真实执行
- **属性面板** - 选择 Agent/Team、配置参数、查看运行结果

### 全局能力
- **全局搜索** - Cmd+K 唤起，搜索任务、Agent、文件、命令
- **通知中心** - 统一接收任务完成、Agent 消息、系统提醒
- **设置中心** - 壁纸、API Key、派活模式配置

## 技术栈

```
Frontend:  React 18 + TypeScript + Vite + TailwindCSS + React Flow + Zustand
Backend:   Node.js + Fastify + Socket.IO + BullMQ
Database:  SQLite (better-sqlite3) + Redis
AI:        OpenRouter (Claude via OpenAI-compatible API)
Runtime:   Docker + Node.js Process (Sandbox)
Infra:     pnpm Workspaces + Turborepo
```

## 项目结构

```
webos-agent-platform/
├── apps/
│   ├── web/          # React 前端应用 (WebOS Desktop UI)
│   └── api/          # Fastify 后端 API
├── packages/
│   ├── core/         # 共享类型和工具 (Zod schemas)
│   └── ui/           # 共享 UI 组件
├── turbo.json        # Turborepo 配置
└── pnpm-workspace.yaml
```

## 快速开始

### 前置条件

- Node.js >= 20
- pnpm >= 9
- Redis（本地安装：`brew install redis && brew services start redis`）

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/rogerhorsley/webos-agent-platform.git
cd webos-agent-platform

# 安装依赖
pnpm install

# 配置环境变量
cp apps/api/.env.example apps/api/.env
# 编辑 .env，填入 ANTHROPIC_API_KEY（支持 OpenRouter key）

# 启动开发服务器
pnpm dev
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

### 环境变量（apps/api/.env）

```
PORT=3000
HOST=0.0.0.0
ANTHROPIC_API_KEY=sk-or-v1-xxxxx   # OpenRouter API Key
REDIS_URL=redis://localhost:6379
DATABASE_URL=./data/nexusos.db
DATA_DIR=./data
SANDBOX_MODE=process

# Remote Docker Sandbox (optional)
# SANDBOX_MODE=docker
# DOCKER_HOST=tcp://YOUR_SERVER_IP:2376
# DOCKER_TLS_CA=../../docker-certs/ca.pem
# DOCKER_TLS_CERT=../../docker-certs/cert.pem
# DOCKER_TLS_KEY=../../docker-certs/key.pem
# REMOTE_WORKSPACES_ROOT=/opt/nexusos/workspaces
```

## 开发路线图

### Phase 1: Foundation ✅
- [x] 项目脚手架搭建（pnpm monorepo + Turborepo）
- [x] WebOS 桌面框架（窗口管理、Dock、Status Bar）
- [x] 基础 UI 组件库（@webos/ui）
- [x] 桌面 Widget 系统（系统总览、Agent 状态、任务、实时动态）
- [x] 壁纸系统（9 款弥散色彩壁纸）

### Phase 2: Core Modules ✅
- [x] Agent 管理模块（CRUD + coordinator 角色）
- [x] Task 管理模块（看板 + 进度追踪）
- [x] Chat 对话模块（多模态渲染 + 流式 + 停止）
- [x] OpenRouter 集成（Claude via OpenAI-compatible API）

### Phase 3: Advanced Features ✅
- [x] NexusCore 主助手（意图识别 + 派活）
- [x] Multi-Agent Team 协作（三种模式）
- [x] Agent 通信协议（SharedContext + AgentMessageBus）
- [x] 可视化画布工作流执行引擎
- [x] Agent 市场（12 个预置模板 + 一键安装）
- [x] Skills 市场 + 组合器（16 个 skills + chains 管道）
- [x] Docker 远程沙箱（腾讯云 Lighthouse + TLS）
- [x] Terminal Claude Code 集成（一键启动 + 后台任务）

### Phase 4: Polish & Scale
- [x] 全仓 TypeScript typecheck 通过
- [ ] 用户认证系统
- [ ] 性能优化
- [ ] 安全加固
- [ ] 监控告警

## License

MIT
