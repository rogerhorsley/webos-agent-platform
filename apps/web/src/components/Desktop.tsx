import { useState, useEffect } from 'react'
import { Search, Command } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'

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
  const triggerSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div className="absolute inset-0 bg-desktop-bg overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* System bar */}
      <div className="absolute top-0 left-0 right-0 h-9 z-10 flex items-center px-4"
        style={{
          background: 'rgba(12,12,14,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Left — brand */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-desktop-accent flex items-center justify-center">
            <span className="text-white text-[10px] font-bold leading-none">N</span>
          </div>
          <span className="text-ink-3 text-xs font-medium">NexusOS</span>
        </div>

        {/* Center — search trigger */}
        <button
          onClick={triggerSearch}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-ink-4 hover:text-ink-2 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Search className="w-3 h-3" />
          <span>搜索</span>
          <kbd className="ml-1 px-1 py-0.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
            ⌘K
          </kbd>
        </button>

        {/* Right — notifications + clock */}
        <div className="ml-auto flex items-center gap-3">
          <NotificationCenter />
          <Clock />
        </div>
      </div>
    </div>
  )
}
