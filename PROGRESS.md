# NexusOS 开发进度

> 最后更新：2026-03-04

## 已完成功能

### Phase 1: 桌面框架 ✅
- WebOS 窗口管理系统（拖拽、缩放、最小化、最大化、z-index 管理）
- Dock 栏（全宽吸底、App 启动器 + Window Tray）
- Status Bar（常驻顶部、搜索、通知、时钟）
- 桌面 Widget 仪表盘（系统总览、Agents、任务、实时动态、快速启动）
- 壁纸系统（9 款弥散色彩壁纸，localStorage 持久化）
- 全局搜索（⌘K 快捷键）
- Toast 通知系统

### Phase 2: 核心模块 ✅
- Agent CRUD（含 coordinator 角色）
- Task 管理（看板视图、进度追踪）
- Chat 对话（多模态渲染、Markdown、代码高亮、流式响应、停止按钮）
- OpenRouter 集成（Claude via OpenAI-compatible API）

### Phase 3: Multi-Agent 协作 ✅
- NexusCore 主助手（意图识别 + 自动/确认派活）
- Agent Team 协作（Sequential / Parallel / Hierarchical 三种模式）
- Agent 通信协议（SharedContext + AgentMessageBus）
- 可视化画布工作流执行引擎（拓扑排序 + 节点执行）
- Agent 市场（12 个预置模板 + 一键安装）
- Skills 市场 + 组合器（16 个 skills + chains 管道）

### Phase 4: Docker 远程沙箱 ✅
- ContainerManager 服务（创建/启动/停止/重启/exec/attach）
- 远程 Docker Host 支持（TLS 双向认证）
- 腾讯云 Lighthouse 配置脚本 + 已验证连接
- Terminal 重写（Docker 容器终端 + 本地 fallback + Agent 切换）
- Claude Code / Claude Task 集成
- `/api/sandbox/*` REST API

### Phase 5: 渠道 + 定时任务 + Agent 自主性 ✅
- 渠道系统（ChannelManager + 适配器模式）
- Telegram 适配器（grammy，Long Polling）
- 飞书适配器（@larksuiteoapi/node-sdk，WebSocket）
- 渠道 CRUD API + 连接/断开/发送/消息历史
- 定时任务调度器（cron/interval/once，30s 轮询）
- Agent 自主性引擎（消息驱动 + 定时驱动 + 事件驱动）
- 前端 ChannelsApp（渠道管理 + 定时任务 UI）

### Phase 6: 内置应用套件 🔧 (进行中)
- ✅ 后端 notes 表 + CRUD API（`/api/notes`）
- ✅ 后端 mail_accounts + mail_messages 表
- ✅ 后端 mailService（IMAP/SMTP）
- ✅ 后端 browserProxy（Puppeteer 会话管理）
- ✅ 后端 browser routes（navigate/click/type/screenshot/back/forward）
- ✅ 后端 mail routes（inbox/send/reply/delete）
- ✅ 依赖安装（TipTap, Puppeteer, imapflow, nodemailer）
- ⬜ 前端 NoteApp（TipTap 富文本编辑器）
- ⬜ 前端 BrowserApp（截图交互浏览器）
- ⬜ 前端 MailApp（三栏邮件客户端）
- ⬜ 前端 WorkspaceApp 升级（双栏文件管理器）
- ⬜ Dock 更新（新增 Notes/Browser/Mail 图标）

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS + Zustand + TanStack Query + React Flow + xterm.js + TipTap |
| 后端 | Node.js + Fastify + Socket.IO + BullMQ |
| 数据库 | SQLite (better-sqlite3) + Redis |
| AI | OpenRouter (Claude via OpenAI-compatible API) |
| 沙箱 | Docker (远程 TLS, 腾讯云 Lighthouse) |
| 渠道 | grammy (Telegram) + @larksuiteoapi/node-sdk (飞书) |
| 邮件 | imapflow (IMAP) + nodemailer (SMTP) |
| 浏览器 | puppeteer-core |
| 工程化 | pnpm Workspaces + Turborepo |

## 项目结构

```
webos-agent-platform/
├── apps/
│   ├── web/                    # React 前端
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Desktop.tsx, Dock.tsx, Window.tsx, WindowManager.tsx
│   │       │   ├── DesktopWidgets.tsx, GlobalSearch.tsx, NotificationCenter.tsx
│   │       │   ├── apps/       # 所有应用组件
│   │       │   │   ├── ChatApp.tsx, AgentTeamApp.tsx, TasksApp.tsx
│   │       │   │   ├── CanvasApp.tsx, TerminalApp.tsx, SkillsApp.tsx
│   │       │   │   ├── ChannelsApp.tsx, SettingsApp.tsx, WorkspaceApp.tsx
│   │       │   │   └── PromptsApp.tsx, PlaceholderApp.tsx
│   │       │   └── chat/       # Chat 子组件
│   │       ├── stores/         # Zustand stores
│   │       ├── hooks/          # React Query hooks
│   │       └── lib/            # API client, Socket
│   └── api/                    # Fastify 后端
│       └── src/
│           ├── db/index.ts     # SQLite schema + seeds
│           ├── routes/         # REST API
│           │   ├── agents.ts, tasks.ts, teams.ts, workflows.ts
│           │   ├── skills.ts, prompts.ts, channels.ts, scheduledTasks.ts
│           │   ├── sandbox.ts, browser.ts, notes.ts, terminal.ts
│           │   ├── workspaces.ts, mcp.ts, mail.ts (待创建)
│           ├── services/       # 业务逻辑
│           │   ├── claude.ts, nexusCore.ts, messageBus.ts
│           │   ├── teamOrchestrator.ts, taskQueue.ts, sandbox.ts
│           │   ├── containerManager.ts, channelManager.ts
│           │   ├── taskScheduler.ts, agentAutonomy.ts
│           │   ├── browserProxy.ts, mailService.ts, workspace.ts
│           └── channels/       # 渠道适配器
│               ├── telegram.ts, feishu.ts, index.ts
├── packages/
│   ├── core/                   # Zod 类型定义
│   └── ui/                     # 共享 UI 组件
├── docker-certs/               # Docker TLS 证书 (gitignored)
├── scripts/
│   └── setup-remote-docker.sh  # 腾讯云 Docker 配置脚本
├── Dockerfile, Dockerfile.agent, docker-compose.yml
└── CHANGELOG.md, README.md, PROGRESS.md
```

## 数据库表

| 表 | 用途 |
|---|---|
| agents | Agent 定义（含 NexusCore seed） |
| agent_teams | Team 配置（成员、协作模式） |
| agent_messages | Agent 间通信消息 |
| agent_templates | 预置 Agent 模板（市场） |
| tasks | 任务（看板） |
| scheduled_tasks | 定时任务（cron/interval/once） |
| workflows | 可视化工作流 |
| skills | 技能插件 |
| skill_chains | 技能组合管道 |
| prompts | 提示词模板 |
| channels | 消息渠道配置（Telegram/飞书） |
| channel_messages | 渠道消息记录 |
| notes | 笔记（富文本） |
| mail_accounts | 邮件账户配置 |
| mail_messages | 邮件缓存 |
| mcp_servers | MCP 服务器 |

## 环境配置

### 必需
- Node.js >= 20, pnpm >= 9
- Redis（本地 `brew install redis`）
- OpenRouter API Key（`.env` 中的 `ANTHROPIC_API_KEY`）

### 可选
- Docker 远程沙箱（腾讯云 Lighthouse `43.134.236.188:2376`）
- Telegram Bot Token（渠道功能）
- 飞书 App ID/Secret（渠道功能）

## 待办（Phase 6 剩余）

1. **前端 NoteApp** — TipTap 富文本编辑器，左侧笔记列表 + 右侧编辑器 + AI 辅助
2. **前端 BrowserApp** — 地址栏 + 截图展示 + 点击/输入事件转发
3. **前端 MailApp** — 三栏布局（文件夹/列表/内容）+ 写邮件弹窗
4. **前端 WorkspaceApp 升级** — 双栏文件管理器 + 上传/重命名/移动
5. **Dock 更新** — 新增 Notes/Browser/Mail 图标
6. **后端 mail routes** — `apps/api/src/routes/mail.ts`（待创建）

## 后续规划

- 用户认证系统（JWT/OAuth）
- 性能优化（虚拟列表、懒加载）
- 安全加固（CSRF、Rate Limiting）
- 监控告警（健康检查、错误追踪）
- 国际化（i18n）
