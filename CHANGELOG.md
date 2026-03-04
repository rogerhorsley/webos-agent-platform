# Changelog

## [0.3.0] - 2026-03-04

### Docker 远程沙箱

- 新增 `ContainerManager` 服务：容器全生命周期管理（创建/启动/停止/重启/exec/attach）
- 支持远程 Docker Host（TLS 双向认证），通过 `DOCKER_HOST` 环境变量配置
- 新增 `scripts/setup-remote-docker.sh`：一键配置腾讯云 Lighthouse Docker + TLS + 沙箱镜像
- 新增 `/api/sandbox/*` REST API：status / containers / start / stop / restart / exec
- `execInWorkspace` 和 `runClaudeTask` 在 Docker 模式下自动走容器执行
- Terminal 重写：支持 Docker 容器终端（PTY attach）+ 本地 fallback + Agent 切换
- 已在腾讯云 `43.134.236.188:2376` 验证全链路通过

### Terminal 增强

- Agent 选择器：工具栏下拉选择 Agent，自动连接到对应 Docker 容器
- Claude Code 按钮：一键在终端中启动 `claude` 交互式会话
- Claude Task 按钮：输入任务描述 -> 后台 `claude --print` -> 输出到终端 + 自动创建 Task
- NL Mode 修复：`onToken` 参数类型已修正
- Docker 状态指示：工具栏显示 Local/Sandbox 模式 + Docker badge

### Agent 市场

- 新增 `agent_templates` 表 + 12 个预置模板（写作助手、数据分析师、代码审查员等）
- `GET /api/agents/templates` + `POST /api/agents/templates/:slug/install`
- AgentTeamApp 新增 Market Tab：模板卡片网格 + 搜索 + 一键安装

### Skills 升级

- 扩充 seed skills 到 16 个（含 content/triggers 字段）
- 新增 `skill_chains` 表 + CRUD API + `POST /chains/:id/run`（按顺序执行多个 skills）
- SkillsApp 新增 Chains Tab：创建组合 + 排序 + 运行 + 结果展示

## [0.2.0] - 2026-03-04

### Multi-Agent Team 协作系统

**NexusCore 主助手**
- 新增系统内置 Agent `nexus-core`（coordinator 角色），启动时自动 seed
- 实现意图识别：直接回复 / 单 Agent 派活 / Team 协作派活
- 支持自动执行和确认后执行两种派活模式（Settings 可切换）
- Chat 默认选中 NexusCore，显示"主助手"标识
- 派活指令通过 `<dispatch>` 标签嵌入回复，前端解析为派活卡片

**Agent 通信协议**
- 新增 `agent_messages` 表，存储 Agent 间结构化消息
- 实现 `AgentMessageBus` 服务：send / getHistory / getForAgent / buildContextPrompt
- 支持 5 种消息类型：dispatch / report / request / handoff / context_update
- 实现 `SharedContext`：对话历史 + 中间产物 + 工作流变量

**Team 管理**
- 新增 `agent_teams` 表 + `/api/teams` CRUD API + `/api/teams/:id/run`
- Team 详情自动 hydrate 成员 Agent 完整信息
- 前端 `AgentTeamApp` 重构为 Agents / Teams 双 Tab
- Team 创建/编辑弹窗：成员选择、协作模式、Coordinator、SharedContext 开关

**协作执行引擎**
- 新增 `teamOrchestrator.ts`，实现三种协作模式：
  - Sequential：链式执行，前一个输出作为下一个输入
  - Parallel：并发执行，Coordinator 合并结果
  - Hierarchical：Coordinator 分配子任务，Workers 执行，Coordinator 汇总
- `taskQueue.ts` 支持 `teamId` 自动切换到 Team 编排执行
- 子任务快照持久化（parentTaskId 关联）
- Socket.IO 实时事件：team:progress / team:step / team:token / team:done

**Canvas 工作流**
- 新增 `agent_team` 节点类型（紫色，含 Team 选择器）
- 工作流执行引擎从 stub 改为可执行：拓扑排序 + 节点分类执行
- 支持 agent / agent_team / condition / parallel / output 等节点类型
- 属性面板支持选择 Agent 和 Team

**TasksApp 升级**
- 创建任务支持 Agent / Team 互斥选择
- 新增 TeamRunPanel 实时执行面板（时间线 + 步骤状态）

### Chat 增强

- 多模态渲染：Markdown / 代码高亮 / 图片 / 视频 / 音频 / URL
- 代码块：50+ 语言语法高亮、行号、复制、全屏展开
- 流式停止：前端 ■ 按钮 + 后端 AbortController
- 附件上传：粘贴图片、拖拽文件、附件按钮
- NexusCore 派活卡片：目标、任务、执行状态内嵌

### 桌面系统

- 桌面 Widget 仪表盘：系统总览、Agents、任务、实时动态、快速启动
- Dock 全宽吸底，顶部圆角，右侧 Window Tray
- Status Bar 和 Dock z-index 9000 常驻
- 窗口最大化精确填充安全区域
- 壁纸系统：9 款弥散色彩壁纸，Settings 切换，localStorage 持久化
- 搜索入口改为 icon，保留 ⌘K 快捷键

### 基础设施

- OpenRouter 集成（替代 Anthropic 直连）
- `nodemon` 替代 `tsx watch`（修复 node_modules 监视风暴）
- Redis 安装和配置
- `vite-env.d.ts` 修复 `import.meta.env` 类型
- 全仓 `pnpm typecheck` 通过（6/6 packages）

### Code Review 修复

- messageBus: 新增 `clearContext()` 防止内存泄漏
- teams.ts: 修复 enqueueTask 失败时错误标记为 running
- workflows.ts: 修复空节点列表导致 undefined 崩溃
- index.ts: 新增 socket chat:message 数据验证
- nexusCore.ts: 修复 stripDispatchBlock 误删非派活代码块
- ChatApp: 修复 stale closure（dispatchMode ref）
- ChatApp: 移除冗余三元表达式
- TasksApp: 修复 TeamRunPanel 空 teamId guard
- CanvasApp: MiniMap 补充 agent_team 颜色
- CanvasApp: handleRun 补充 try/catch 错误处理
- db: serializeRow 自动转换 boolean 为 SQLite integer

## [0.1.0] - 2026-03-03

- 项目初始化：pnpm monorepo + Turborepo
- WebOS 桌面框架：窗口管理、Dock、Status Bar
- 基础 App 框架：9 个应用窗口
- Fastify 后端 + SQLite + BullMQ
- Socket.IO 实时通信
