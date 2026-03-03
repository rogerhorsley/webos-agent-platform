# WebOS Agent Platform

AI Agent 工作平台 - WebOS 形态，可视化管理和编排多 Agent

## Features

- **Agent Team Management** - 多 Agent 协作、角色分配、通信协议
- **MCP Management** - Model Context Protocol 注册、调用、权限控制
- **Skills Market** - 技能安装、版本管理、依赖解析
- **Task System** - 任务队列、状态机、并发控制
- **Prompt Templates** - 变量注入、版本管理、渲染引擎
- **Visual Canvas** - React Flow 节点编排、DAG 执行
- **Sandbox Runtime** - Docker/gVisor 隔离、资源限制、安全边界
- **Claude Code Integration** - SDK 封装、工具注册、会话管理

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS + React Flow
- **Backend**: Node.js + Fastify + BullMQ
- **Database**: PostgreSQL + Redis + Pinecone
- **Container**: Docker + gVisor + Kubernetes

## Project Structure

```
webos-agent-platform/
├── apps/
│   ├── web/          # React frontend (WebOS Desktop UI)
│   └── api/          # Fastify backend API
├── packages/
│   ├── core/         # Shared types and utilities
│   └── ui/           # Shared UI components
└── .github/
    └── workflows/    # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/rogerhorsley/webos-agent-platform.git
cd webos-agent-platform

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Available Scripts

```bash
pnpm dev        # Start all apps in development mode
pnpm build      # Build all packages and apps
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type checking
pnpm clean      # Clean all build outputs
```

## Architecture

See [Technical Architecture Document](./docs/architecture.md) for detailed system design.

## License

MIT
