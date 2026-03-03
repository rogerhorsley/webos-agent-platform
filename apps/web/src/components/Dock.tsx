import { useWindowStore } from '../stores/windowStore'
import {
  Users, ListTodo, MessageSquare, Terminal,
  Puzzle, FileText, Workflow, Settings, FolderOpen,
} from 'lucide-react'

const apps = [
  { id: 'agent-team', title: 'Agent Team', icon: 'Users',       component: 'AgentTeam' },
  { id: 'tasks',      title: 'Tasks',      icon: 'ListTodo',    component: 'Tasks' },
  { id: 'chat',       title: 'Chat',       icon: 'MessageSquare', component: 'Chat' },
  { id: 'workspace',  title: 'Workspace',  icon: 'FolderOpen',  component: 'Workspace' },
  { id: 'terminal',   title: 'Terminal',   icon: 'Terminal',    component: 'Terminal' },
  { id: 'skills',     title: 'Skills',     icon: 'Puzzle',      component: 'Skills' },
  { id: 'prompts',    title: 'Prompts',    icon: 'FileText',    component: 'Prompts' },
  { id: 'canvas',     title: 'Canvas',     icon: 'Workflow',    component: 'Canvas' },
  { id: 'settings',   title: 'Settings',   icon: 'Settings',    component: 'Settings' },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, ListTodo, MessageSquare, Terminal, Puzzle, FileText, Workflow, Settings, FolderOpen,
}

export function Dock() {
  const { windows, openWindow, activeWindowId } = useWindowStore()

  return (
    <div className="dock">
      {apps.map((app, index) => {
        const Icon = iconMap[app.icon]
        const isOpen   = windows.some(w => w.id === app.id)
        const isActive = activeWindowId === app.id

        return (
          <div key={app.id} className="relative group">
            {/* Separator before Settings */}
            {index === apps.length - 1 && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-px h-5 bg-white/10" />
            )}

            <button
              className={`dock-item${isActive ? ' active' : ''}`}
              onClick={() => openWindow(app)}
              title={app.title}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              {/* Running indicator */}
              {isOpen && !isActive && (
                <span className="dot" />
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-desktop-elevated text-ink-1 text-xs rounded-md border border-white/8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-menu">
              {app.title}
            </div>
          </div>
        )
      })}
    </div>
  )
}
