import { useEffect, useRef, useState } from 'react'
import {
  Bot, ListTodo, Workflow, Zap,
  CheckCircle2, Circle, AlertCircle, Clock, Loader2,
  ChevronRight, Activity, Cpu,
} from 'lucide-react'
import { useAgents } from '../hooks/useAgents'
import { useTasks } from '../hooks/useTasks'
import { useWorkflows } from '../hooks/useWorkflows'
import { useWindowStore } from '../stores/windowStore'
import { getSocket } from '../lib/socket'

// ─── Dock app map (for openWindow) ───────────────────────────────────────────
const APP_MAP: Record<string, { id: string; title: string; icon: string; component: string }> = {
  chat:      { id: 'chat',       title: 'Chat',       icon: 'MessageSquare', component: 'Chat' },
  tasks:     { id: 'tasks',      title: 'Tasks',      icon: 'ListTodo',      component: 'Tasks' },
  agents:    { id: 'agent-team', title: 'Agent Team', icon: 'Users',         component: 'AgentTeam' },
  canvas:    { id: 'canvas',     title: 'Canvas',     icon: 'Workflow',      component: 'Canvas' },
}

// ─── Shared widget shell ──────────────────────────────────────────────────────
function Widget({
  title, icon, onClick, children, className = '',
}: {
  title: string
  icon: React.ReactNode
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden select-none ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: 'rgba(18,18,22,0.72)',
        backdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
      onClick={onClick}
    >
      {/* Widget header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2 text-ink-3">
          <span className="text-desktop-accent opacity-80">{icon}</span>
          <span className="text-[11px] font-semibold tracking-wide uppercase">{title}</span>
        </div>
        {onClick && <ChevronRight className="w-3 h-3 text-ink-4 opacity-60" />}
      </div>
      {children}
    </div>
  )
}

// ─── Task status helpers ──────────────────────────────────────────────────────
function TaskStatusIcon({ status }: { status: string }) {
  if (status === 'running')   return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
  if (status === 'completed') return <CheckCircle2 className="w-3 h-3 text-green-400" />
  if (status === 'failed')    return <AlertCircle  className="w-3 h-3 text-red-400" />
  if (status === 'pending')   return <Clock        className="w-3 h-3 text-yellow-400" />
  return <Circle className="w-3 h-3 text-ink-4" />
}

const STATUS_COLOR: Record<string, string> = {
  running:   'rgba(96,165,250,0.15)',
  completed: 'rgba(74,222,128,0.1)',
  failed:    'rgba(248,113,113,0.12)',
  pending:   'rgba(250,204,21,0.1)',
}
const STATUS_TEXT: Record<string, string> = {
  running: '#93c5fd', completed: '#86efac', failed: '#fca5a5', pending: '#fde047',
}

// ─── 1. System Overview ───────────────────────────────────────────────────────
function SystemOverviewWidget() {
  const { data: agents = [] }    = useAgents()
  const { data: tasks = [] }     = useTasks()
  const { data: workflows = [] } = useWorkflows()
  const { openWindow }           = useWindowStore()

  const running   = (tasks as any[]).filter(t => t.status === 'running').length
  const pending   = (tasks as any[]).filter(t => t.status === 'pending').length
  const completed = (tasks as any[]).filter(t => t.status === 'completed').length

  const stats = [
    {
      label: 'Agents', value: agents.length,
      icon: <Bot className="w-4 h-4" />, color: '#c084fc',
      app: 'agents',
    },
    {
      label: '运行中', value: running,
      icon: <Loader2 className={`w-4 h-4 ${running > 0 ? 'animate-spin' : ''}`} />, color: '#60a5fa',
      app: 'tasks',
    },
    {
      label: '待处理', value: pending,
      icon: <Clock className="w-4 h-4" />, color: '#fbbf24',
      app: 'tasks',
    },
    {
      label: '已完成', value: completed,
      icon: <CheckCircle2 className="w-4 h-4" />, color: '#34d399',
      app: 'tasks',
    },
    {
      label: 'Workflows', value: workflows.length,
      icon: <Workflow className="w-4 h-4" />, color: '#fb923c',
      app: 'canvas',
    },
  ]

  return (
    <div
      className="flex items-stretch gap-px rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(18,18,22,0.72)',
        backdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {stats.map((s, i) => (
        <button
          key={s.label}
          className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3 transition-colors hover:bg-white/[0.04] group"
          style={i < stats.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.06)' } : {}}
          onClick={() => openWindow(APP_MAP[s.app])}
        >
          <span style={{ color: s.color }} className="opacity-70 group-hover:opacity-100 transition-opacity">
            {s.icon}
          </span>
          <span className="text-xl font-bold text-ink-1 tabular-nums leading-none">{s.value}</span>
          <span className="text-[10px] text-ink-4 font-medium">{s.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── 2. Agents Widget ─────────────────────────────────────────────────────────
function AgentsWidget() {
  const { data: agents = [] } = useAgents()
  const { data: tasks = [] }  = useTasks()
  const { openWindow }        = useWindowStore()

  const runningByAgent = (tasks as any[])
    .filter(t => t.status === 'running')
    .reduce((acc: Record<string, number>, t) => {
      if (t.agentId) acc[t.agentId] = (acc[t.agentId] || 0) + 1
      return acc
    }, {})

  return (
    <Widget
      title="Agents"
      icon={<Bot className="w-3.5 h-3.5" />}
      onClick={() => openWindow(APP_MAP.agents)}
      className="h-full"
    >
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {(agents as any[]).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-ink-4 gap-2">
            <Bot className="w-6 h-6 opacity-30" />
            <span className="text-[11px]">暂无 Agent</span>
          </div>
        ) : (
          (agents as any[]).map((agent: any) => {
            const active = runningByAgent[agent.id] || 0
            return (
              <div
                key={agent.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors hover:bg-white/[0.05]"
                style={{ background: active > 0 ? 'rgba(96,165,250,0.08)' : 'transparent' }}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#c084fc' }}
                >
                  {agent.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ink-2 truncate">{agent.name}</div>
                  <div className="text-[10px] text-ink-4 truncate">{agent.config?.model ?? 'default model'}</div>
                </div>
                {/* Status dot */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {active > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      {active}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </Widget>
  )
}

// ─── 3. Active Tasks Widget ───────────────────────────────────────────────────
function TasksWidget() {
  const { data: tasks = [] } = useTasks()
  const { openWindow }       = useWindowStore()

  const activeTasks = (tasks as any[])
    .filter(t => t.status === 'running' || t.status === 'pending')
    .slice(0, 6)

  const recentDone = (tasks as any[])
    .filter(t => t.status === 'completed' || t.status === 'failed')
    .slice(0, 3)

  const display = [...activeTasks, ...recentDone].slice(0, 7)

  return (
    <Widget
      title="任务"
      icon={<ListTodo className="w-3.5 h-3.5" />}
      onClick={() => openWindow(APP_MAP.tasks)}
      className="h-full"
    >
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {display.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-ink-4 gap-2">
            <ListTodo className="w-6 h-6 opacity-30" />
            <span className="text-[11px]">暂无任务</span>
          </div>
        ) : (
          display.map((task: any) => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors"
              style={{ background: STATUS_COLOR[task.status] ?? 'transparent' }}
            >
              <TaskStatusIcon status={task.status} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-ink-2 truncate">
                  {task.title || task.input?.prompt?.slice(0, 40) || '无标题'}
                </div>
                <div className="text-[10px] text-ink-4">
                  {task.type} · {new Date(task.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ color: STATUS_TEXT[task.status], background: STATUS_COLOR[task.status] }}
              >
                {task.status}
              </span>
            </div>
          ))
        )}
      </div>
    </Widget>
  )
}

// ─── 4. Activity Feed Widget ──────────────────────────────────────────────────
interface ActivityEvent {
  id: string
  time: Date
  type: 'task:status' | 'task:token' | 'chat' | 'connect' | 'disconnect'
  label: string
  detail?: string
  color: string
}

function ActivityFeedWidget() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socket = getSocket()

    const push = (e: Omit<ActivityEvent, 'id' | 'time'>) => {
      setEvents(prev => [
        { ...e, id: Math.random().toString(36).slice(2), time: new Date() },
        ...prev.slice(0, 49),  // keep last 50
      ])
    }

    const onConnect = () => push({ type: 'connect', label: '已连接到服务器', color: '#34d399' })
    const onDisconnect = () => push({ type: 'disconnect', label: '服务器连接断开', color: '#fca5a5' })

    const onTaskStatus = (data: any) => {
      const statusLabel: Record<string, string> = {
        running: '任务开始运行', completed: '任务完成', failed: '任务失败', pending: '任务排队中',
      }
      push({
        type: 'task:status',
        label: statusLabel[data.status] ?? `任务状态: ${data.status}`,
        detail: data.taskId?.slice(0, 8),
        color: STATUS_TEXT[data.status] ?? '#94a3b8',
      })
    }

    const onChatDone = (data: any) => {
      push({
        type: 'chat',
        label: 'Chat 回复完成',
        detail: data.content?.slice(0, 30),
        color: '#c084fc',
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('task:status', onTaskStatus)
    socket.on('chat:done', onChatDone)

    // Initial connect event if already connected
    if (socket.connected) {
      push({ type: 'connect', label: '已连接到服务器', color: '#34d399' })
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('task:status', onTaskStatus)
      socket.off('chat:done', onChatDone)
    }
  }, [])

  return (
    <Widget
      title="实时动态"
      icon={<Activity className="w-3.5 h-3.5" />}
      className="h-full"
    >
      <div ref={listRef} className="flex-1 overflow-auto p-2 space-y-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-ink-4 gap-2">
            <Activity className="w-6 h-6 opacity-30" />
            <span className="text-[11px]">等待事件…</span>
          </div>
        ) : (
          events.map(e => (
            <div key={e.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
              {/* Color dot */}
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: e.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-ink-2">{e.label}</div>
                {e.detail && (
                  <div className="text-[10px] text-ink-4 truncate font-mono">{e.detail}</div>
                )}
              </div>
              <span className="text-[10px] text-ink-4 tabular-nums flex-shrink-0 mt-0.5">
                {e.time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </Widget>
  )
}

// ─── 5. Quick Launch Widget ───────────────────────────────────────────────────
function QuickLaunchWidget() {
  const { openWindow } = useWindowStore()

  const shortcuts = [
    { label: '新建对话', icon: <Zap className="w-4 h-4" />, color: '#c084fc', app: 'chat' },
    { label: '查看任务', icon: <ListTodo className="w-4 h-4" />, color: '#60a5fa', app: 'tasks' },
    { label: '编排流程', icon: <Workflow className="w-4 h-4" />, color: '#fb923c', app: 'canvas' },
    { label: '管理 Agent', icon: <Cpu className="w-4 h-4" />, color: '#34d399', app: 'agents' },
  ]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(18,18,22,0.72)',
        backdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="grid grid-cols-4 gap-px p-1">
        {shortcuts.map(s => (
          <button
            key={s.label}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all hover:bg-white/[0.06] group"
            onClick={() => openWindow(APP_MAP[s.app])}
          >
            <span className="opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: s.color }}>
              {s.icon}
            </span>
            <span className="text-[10px] text-ink-4 group-hover:text-ink-2 transition-colors text-center leading-tight">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function DesktopWidgets() {
  return (
    // Sits between status bar (36px) and dock (80px from bottom)
    <div
      className="absolute left-0 right-0 overflow-hidden"
      style={{ top: 36, bottom: 64, pointerEvents: 'none' }}
    >
      {/* Pointer-events re-enabled on the widget container */}
      <div
        className="h-full p-5 flex flex-col gap-3"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Row 1: System Overview (full width) */}
        <SystemOverviewWidget />

        {/* Row 2: Quick Launch */}
        <QuickLaunchWidget />

        {/* Row 3: 3-column widgets, fills remaining height */}
        <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
          <AgentsWidget />
          <TasksWidget />
          <ActivityFeedWidget />
        </div>
      </div>
    </div>
  )
}
