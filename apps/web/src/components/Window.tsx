import { useState, useRef } from 'react'
import { useWindowStore, Window as WindowType } from '../stores/windowStore'
import { X, Minus, Square } from 'lucide-react'

// App components
import { AgentTeamApp } from './apps/AgentTeamApp'
import { ChatApp } from './apps/ChatApp'
import { CanvasApp } from './apps/CanvasApp'
import { TasksApp } from './apps/TasksApp'
import { SkillsApp } from './apps/SkillsApp'
import { PromptsApp } from './apps/PromptsApp'
import { TerminalApp } from './apps/TerminalApp'
import { SettingsApp } from './apps/SettingsApp'
import { WorkspaceApp } from './apps/WorkspaceApp'
import { ChannelsApp } from './apps/ChannelsApp'
import { NoteApp } from './apps/NoteApp'
import { BrowserApp } from './apps/BrowserApp'
import { MailApp } from './apps/MailApp'
import { PlaceholderApp } from './apps/PlaceholderApp'

const appComponents: Record<string, React.ComponentType> = {
  AgentTeam: AgentTeamApp,
  Chat: ChatApp,
  Canvas: CanvasApp,
  Tasks: TasksApp,
  Terminal: TerminalApp,
  Skills: SkillsApp,
  Prompts: PromptsApp,
  Settings: SettingsApp,
  Workspace: WorkspaceApp,
  Channels: ChannelsApp,
  Notes: NoteApp,
  Browser: BrowserApp,
  Mail: MailApp,
}

interface WindowProps {
  window: WindowType
}

export function Window({ window }: WindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition } = useWindowStore()
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return
    focusWindow(window.id)
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - window.x, y: e.clientY - window.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    updateWindowPosition(window.id, e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y)
  }

  const handleMouseUp = () => setIsDragging(false)

  const AppComponent = appComponents[window.component] || PlaceholderApp

  const STATUSBAR_H = 36
  const DOCK_H = 64  // padding-top(8) + item(44) + padding-bottom(12)

  const style = window.isMaximized
    ? { top: STATUSBAR_H, left: 0, width: '100%', height: `calc(100% - ${STATUSBAR_H}px - ${DOCK_H}px)`, zIndex: window.zIndex }
    : { top: Math.max(STATUSBAR_H, window.y), left: window.x, width: window.width, height: window.height, zIndex: window.zIndex }

  return (
    <div
      className="window"
      style={style}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => focusWindow(window.id)}
    >
      {/* Title bar */}
      <div className="window-titlebar" onMouseDown={handleMouseDown}>
        {/* Traffic lights — macOS style, left side */}
        <div className="window-controls flex items-center gap-1.5">
          <button
            className="w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-110 flex items-center justify-center group transition-all"
            onClick={() => closeWindow(window.id)}
            title="Close"
          >
            <X className="w-2 h-2 text-[#991000] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>
          <button
            className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:brightness-110 flex items-center justify-center group transition-all"
            onClick={() => minimizeWindow(window.id)}
            title="Minimize"
          >
            <Minus className="w-2 h-2 text-[#7D4700] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>
          <button
            className="w-3 h-3 rounded-full bg-[#28C840] hover:brightness-110 flex items-center justify-center group transition-all"
            onClick={() => maximizeWindow(window.id)}
            title="Maximize"
          >
            <Square className="w-2 h-2 text-[#006500] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          </button>
        </div>

        {/* Window title — centered */}
        <span className="absolute left-1/2 -translate-x-1/2 text-ink-2 text-xs font-medium select-none pointer-events-none">
          {window.title}
        </span>
      </div>

      {/* Content */}
      <div className="window-content" style={{ height: 'calc(100% - 40px)' }}>
        <AppComponent />
      </div>
    </div>
  )
}
