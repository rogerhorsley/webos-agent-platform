import { useWindowStore } from '../stores/windowStore'
import { useBadgeStore } from '../stores/badgeStore'
import {
  Users, ListTodo, MessageSquare, Terminal,
  Puzzle, FileText, Workflow, Settings, FolderOpen,
  Minus, Radio, StickyNote, Globe, Mail,
} from 'lucide-react'

const apps = [
  { id: 'agent-team', title: 'Agent Team', icon: 'Users',         component: 'AgentTeam' },
  { id: 'tasks',      title: 'Tasks',      icon: 'ListTodo',      component: 'Tasks' },
  { id: 'chat',       title: 'Chat',       icon: 'MessageSquare', component: 'Chat' },
  { id: 'channels',   title: 'Channels',   icon: 'Radio',         component: 'Channels' },
  { id: 'workspace',  title: 'Workspace',  icon: 'FolderOpen',    component: 'Workspace' },
  { id: 'terminal',   title: 'Terminal',   icon: 'Terminal',      component: 'Terminal' },
  { id: 'notes',      title: 'Notes',      icon: 'StickyNote',    component: 'Notes' },
  { id: 'browser',    title: 'Browser',    icon: 'Globe',         component: 'Browser' },
  { id: 'mail',       title: 'Mail',       icon: 'Mail',          component: 'Mail' },
  { id: 'skills',     title: 'Skills',     icon: 'Puzzle',        component: 'Skills' },
  { id: 'prompts',    title: 'Prompts',    icon: 'FileText',      component: 'Prompts' },
  { id: 'canvas',     title: 'Canvas',     icon: 'Workflow',      component: 'Canvas' },
  { id: 'settings',   title: 'Settings',   icon: 'Settings',      component: 'Settings' },
]

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number | string }>> = {
  Users, ListTodo, MessageSquare, Terminal, Puzzle, FileText, Workflow, Settings, FolderOpen, Radio,
  StickyNote, Globe, Mail,
}

function WindowTray() {
  const { windows, activeWindowId, focusWindow, closeWindow } = useWindowStore()

  if (windows.length === 0) return null

  return (
    <>
      <div className="self-stretch w-px mx-1 my-1.5 bg-white/10 flex-shrink-0" />

      <div className="flex items-center gap-1 overflow-x-auto max-w-[480px] px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {windows.map(w => {
          const isActive    = w.id === activeWindowId
          const isMinimized = w.isMinimized

          return (
            <div key={w.id} className="relative group flex-shrink-0">
              <button
                onClick={() => {
                  if (isMinimized) {
                    useWindowStore.setState(s => ({
                      windows: s.windows.map(win =>
                        win.id === w.id ? { ...win, isMinimized: false } : win
                      ),
                    }))
                  }
                  focusWindow(w.id)
                }}
                className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: isActive
                    ? 'rgba(232,76,106,0.15)'
                    : isMinimized
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.06)',
                  border: isActive
                    ? '1px solid rgba(232,76,106,0.3)'
                    : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? '#E84C6A' : isMinimized ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)',
                  maxWidth: '140px',
                  opacity: isMinimized ? 0.6 : 1,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? '#E84C6A' : isMinimized ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
                    boxShadow: isActive ? '0 0 6px #E84C6A' : 'none',
                  }}
                />
                <span className="truncate leading-none flex-1">{w.title}</span>
                {isMinimized && (
                  <Minus className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
                )}
                <span
                  onClick={e => { e.stopPropagation(); closeWindow(w.id) }}
                  className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-[#991000] flex-shrink-0 ml-0.5"
                >
                  ×
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function Dock() {
  const { windows, openWindow, activeWindowId } = useWindowStore()
  const taskRunningCount = useBadgeStore(s => s.taskRunningCount)
  const chatUnread = useBadgeStore(s => s.chatUnread)

  return (
    <div className="dock">
      {apps.map((app, index) => {
        const Icon     = iconMap[app.icon]
        const isOpen   = windows.some(w => w.id === app.id)
        const isActive = activeWindowId === app.id

        const showTaskBadge = app.id === 'tasks' && taskRunningCount > 0
        const showChatDot = app.id === 'chat' && chatUnread > 0

        return (
          <div key={app.id} className="relative group">
            {index === apps.length - 1 && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-px h-5 bg-white/10" />
            )}

            <button
              className={`dock-item${isActive ? ' active' : ''}`}
              onClick={() => openWindow(app)}
              title={app.title}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              {isOpen && !isActive && <span className="dot" />}
            </button>

            {showTaskBadge && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white pointer-events-none"
                style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.5)' }}
              >
                {taskRunningCount}
              </span>
            )}

            {showChatDot && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full pointer-events-none"
                style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.5)' }}
              />
            )}

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-desktop-elevated text-ink-1 text-xs rounded-md border border-white/8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-menu">
              {app.title}
            </div>
          </div>
        )
      })}

      <WindowTray />
    </div>
  )
}
