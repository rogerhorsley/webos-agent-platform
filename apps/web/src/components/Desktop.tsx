import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { DesktopWidgets } from './DesktopWidgets'
import { useWallpaperStore } from '../stores/wallpaperStore'

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-ink-2 text-xs tabular-nums font-medium select-none">
      {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
    </span>
  )
}

export function Desktop() {
  const wallpaper = useWallpaperStore(s => s.getActive())
  const triggerSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden transition-all duration-700"
      style={{ background: wallpaper.css }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* System bar */}
      <div className="absolute top-0 left-0 right-0 h-9 flex items-center px-4"
        style={{
          background: 'rgba(12,12,14,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 9000,
        }}
      >
        {/* Left — brand */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-desktop-accent flex items-center justify-center">
            <span className="text-white text-[10px] font-bold leading-none">N</span>
          </div>
          <span className="text-ink-3 text-xs font-medium">NexusOS</span>
        </div>

        {/* Center — removed, search moved to right side */}

        {/* Right — search + notifications + clock */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={triggerSearch}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-4 hover:text-ink-2 hover:bg-white/[0.06] transition-colors"
            title="搜索 (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <NotificationCenter />
          <Clock />
        </div>
      </div>
      {/* Desktop Widgets */}
      <DesktopWidgets />
    </div>
  )
}
