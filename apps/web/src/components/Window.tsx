import { useState, useRef } from 'react'
import { useWindowStore, Window as WindowType } from '../stores/windowStore'
import { X, Minus, Square } from 'lucide-react'

// App components
import { AgentTeamApp } from './apps/AgentTeamApp'
import { ChatApp } from './apps/ChatApp'
import { CanvasApp } from './apps/CanvasApp'
import { PlaceholderApp } from './apps/PlaceholderApp'

const appComponents: Record<string, React.ComponentType> = {
  AgentTeam: AgentTeamApp,
  Chat: ChatApp,
  Canvas: CanvasApp,
  Tasks: PlaceholderApp,
  Terminal: PlaceholderApp,
  Skills: PlaceholderApp,
  Prompts: PlaceholderApp,
  Settings: PlaceholderApp,
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
    dragOffset.current = {
      x: e.clientX - window.x,
      y: e.clientY - window.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    updateWindowPosition(
      window.id,
      e.clientX - dragOffset.current.x,
      e.clientY - dragOffset.current.y
    )
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const AppComponent = appComponents[window.component] || PlaceholderApp

  const style = window.isMaximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 80px)', zIndex: window.zIndex }
    : { top: window.y, left: window.x, width: window.width, height: window.height, zIndex: window.zIndex }

  return (
    <div
      className="window absolute"
      style={style}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => focusWindow(window.id)}
    >
      <div className="window-titlebar" onMouseDown={handleMouseDown}>
        <span className="text-white text-sm font-medium">{window.title}</span>
        <div className="window-controls flex gap-2">
          <button
            className="w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center"
            onClick={() => minimizeWindow(window.id)}
          >
            <Minus className="w-3 h-3 text-yellow-900" />
          </button>
          <button
            className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center"
            onClick={() => maximizeWindow(window.id)}
          >
            <Square className="w-3 h-3 text-green-900" />
          </button>
          <button
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center"
            onClick={() => closeWindow(window.id)}
          >
            <X className="w-3 h-3 text-red-900" />
          </button>
        </div>
      </div>
      <div className="window-content h-[calc(100%-40px)]">
        <AppComponent />
      </div>
    </div>
  )
}
