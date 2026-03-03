import { useWindowStore } from '../stores/windowStore'
import {
  Users,
  ListTodo,
  MessageSquare,
  Terminal,
  Puzzle,
  FileText,
  Workflow,
  Settings
} from 'lucide-react'

const apps = [
  { id: 'agent-team', title: 'Agent Team', icon: 'Users', component: 'AgentTeam' },
  { id: 'tasks', title: 'Tasks', icon: 'ListTodo', component: 'Tasks' },
  { id: 'chat', title: 'Chat', icon: 'MessageSquare', component: 'Chat' },
  { id: 'terminal', title: 'Terminal', icon: 'Terminal', component: 'Terminal' },
  { id: 'skills', title: 'Skills', icon: 'Puzzle', component: 'Skills' },
  { id: 'prompts', title: 'Prompts', icon: 'FileText', component: 'Prompts' },
  { id: 'canvas', title: 'Canvas', icon: 'Workflow', component: 'Canvas' },
  { id: 'settings', title: 'Settings', icon: 'Settings', component: 'Settings' },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  ListTodo,
  MessageSquare,
  Terminal,
  Puzzle,
  FileText,
  Workflow,
  Settings,
}

export function Dock() {
  const { windows, openWindow, activeWindowId } = useWindowStore()

  return (
    <div className="dock">
      {apps.map((app) => {
        const Icon = iconMap[app.icon]
        const isOpen = windows.some(w => w.id === app.id)
        const isActive = activeWindowId === app.id

        return (
          <button
            key={app.id}
            className={`dock-item ${isActive ? 'active' : ''}`}
            onClick={() => openWindow(app)}
            title={app.title}
          >
            <Icon className="w-6 h-6 text-white" />
            {isOpen && (
              <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
