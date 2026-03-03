# NexusOS

> **你的 AI 工作操作系统** —— 把散落的智能能力，编织成一个可触摸的工作桌面。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 核心差异化

| 策略 | 说明 |
|------|------|
| **桌面即工作流** | 不是传统文件管理桌面，而是 Agent、任务、Skills 的可视化编排空间 |
| **人人可用的 Agent** | 图形化 Agent 管理，无需代码即可创建、组合、调度 AI Agent |
| **CLI + GUI 双模态** | 既有高效的命令行入口，也有直观的可视化画布，满足不同深度用户 |

## 目标用户

- **主要用户**: 知识工作者、创作者、独立开发者
- **次要用户**: 小型团队、AI 探索者

## 功能模块

### 桌面系统
- **智能桌面** - 可自由拖拽排列的工作空间，Agent、任务、文件都是桌面上的"对象"
- **多窗口管理** - 支持窗口分屏、层叠、最小化，像真正的操作系统一样操作
- **Dock 栏** - 底部快捷启动栏，一键唤起常用 Agent 和工具

### 任务管理
- **任务创建与分解** - 输入一个目标，AI 自动拆解为可执行的子任务清单
- **任务看板** - 看板视图追踪任务状态（待办/进行中/已完成）
- **任务委派** - 将任务一键指派给指定 Agent 自动执行

### Agent 管理
- **Agent 市场** - 浏览和安装预置 Agent（写作助手、数据分析师、代码审查员等）
- **Agent 创建器** - 零代码配置自定义 Agent：定义角色、能力、知识库
- **Agent 监控面板** - 实时查看 Agent 运行状态、执行日志、资源消耗
- **Agent 协作编排** - 定义多个 Agent 的协作流程（如：A 完成后触发 B）

### Skills 管理
- **Skills 库** - 管理已安装的技能插件（数据处理、文件转换、API 调用等）
- **Skills 市场** - 发现和安装社区共享的 Skills
- **Skills 组合器** - 把多个 Skills 串联成自动化流程

### CLI 终端
- **智能命令行** - 支持自然语言输入，自动解析为系统操作
- **命令历史** - 查看和复用历史命令
- **快捷别名** - 自定义命令别名，提升操作效率

### 可视化画布
- **流程编排画布** - 拖拽式构建 Agent + Skills 的工作流程图
- **实时状态可视化** - 流程节点实时显示执行进度和状态
- **画布模板** - 预置常用流程模板（内容生产、数据分析、项目管理等）

### 全局能力
- **全局搜索** - Cmd+K 唤起，搜索任务、Agent、文件、命令
- **通知中心** - 统一接收任务完成、Agent 消息、系统提醒
- **设置中心** - 主题切换、偏好配置

## 技术栈

```
Frontend:  React 18 + TypeScript + Vite + TailwindCSS + React Flow
Backend:   Node.js + Fastify + Socket.IO + BullMQ
Database:  PostgreSQL + Redis + Pinecone
Runtime:   Docker + gVisor (Sandbox)
Infra:     Kubernetes + Turborepo
```

## 项目结构

```
nexus-os/
├── apps/
│   ├── web/          # React 前端应用 (WebOS Desktop UI)
│   └── api/          # Fastify 后端 API
├── packages/
│   ├── core/         # 共享类型和工具
│   └── ui/           # 共享 UI 组件
├── turbo.json        # Turborepo 配置
└── pnpm-workspace.yaml
```

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/rogerhorsley/webos-agent-platform.git
cd webos-agent-platform

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 开发路线图

### Phase 1: Foundation (4-6 weeks)
- [x] 项目脚手架搭建
- [x] WebOS 桌面框架
- [ ] 基础 UI 组件库
- [ ] 用户认证系统

### Phase 2: Core Modules (6-8 weeks)
- [ ] Agent 管理模块
- [ ] Task 管理模块
- [ ] Chat 对话模块
- [ ] Claude Code 集成

### Phase 3: Advanced Features (6-8 weeks)
- [ ] Agent Team 协作
- [ ] Skills 市场
- [ ] 可视化画布
- [ ] Sandbox 运行时

### Phase 4: Polish & Scale (4-6 weeks)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 监控告警

## License

MIT
