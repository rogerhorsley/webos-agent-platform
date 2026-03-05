import { useState } from 'react'
import { Save, Eye, EyeOff, CheckCircle, Key, Info, ImageIcon } from 'lucide-react'
import { useWallpaperStore, WALLPAPERS, type Wallpaper } from '../../stores/wallpaperStore'

function WallpaperThumb({
  wp, activeId, onSelect,
}: { wp: Wallpaper; activeId: string; onSelect: (id: string) => void }) {
  const isActive = wp.id === activeId
  const isLight = wp.theme === 'light'
  return (
    <button
      onClick={() => onSelect(wp.id)}
      className="group relative rounded-xl overflow-hidden transition-all"
      style={{
        aspectRatio: '16/9',
        background: wp.preview,
        border: isActive ? '2px solid #E84C6A' : isLight ? '2px solid rgba(0,0,0,0.10)' : '2px solid rgba(255,255,255,0.06)',
        boxShadow: isActive
          ? '0 0 0 1px rgba(232,76,106,0.3), 0 4px 16px rgba(0,0,0,0.3)'
          : isLight ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Name label */}
      <div
        className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-center"
        style={{
          background: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span
          className="text-[10px] font-medium"
          style={{ color: isLight ? 'rgba(9,9,11,0.7)' : 'rgba(255,255,255,0.8)' }}
        >
          {wp.name}
        </span>
      </div>
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#E84C6A] flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-colors" />
    </button>
  )
}

export function SettingsApp() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '')
  const [nexusApiKey, setNexusApiKey] = useState(localStorage.getItem('api_key') || '')
  const [showKey, setShowKey] = useState(false)
  const [showNexusKey, setShowNexusKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dispatchMode, setDispatchMode] = useState(localStorage.getItem('nexus_dispatch_mode') || 'auto')

  const { activeId, setWallpaper } = useWallpaperStore()

  const handleSave = () => {
    localStorage.setItem('anthropic_api_key', apiKey)
    localStorage.setItem('api_key', nexusApiKey)
    localStorage.setItem('nexus_dispatch_mode', dispatchMode)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-5 py-1">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Settings</h2>
          <p className="text-ink-3 text-xs mt-0.5">Configure NexusOS preferences</p>
        </div>

        {/* ── Wallpaper ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-3.5 h-3.5 text-desktop-accent" strokeWidth={1.75} />
            <span className="text-ink-2 text-xs font-medium">桌面壁纸</span>
          </div>
          {/* Dark themes */}
          <p className="text-ink-4 text-[11px] mb-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-zinc-700" />
            深色
          </p>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {WALLPAPERS.filter(wp => wp.theme === 'dark').map(wp => (
              <WallpaperThumb key={wp.id} wp={wp} activeId={activeId} onSelect={setWallpaper} />
            ))}
          </div>
          {/* Light themes */}
          <p className="text-ink-4 text-[11px] mb-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-zinc-200 border border-zinc-300" />
            浅色
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {WALLPAPERS.filter(wp => wp.theme === 'light').map(wp => (
              <WallpaperThumb key={wp.id} wp={wp} activeId={activeId} onSelect={setWallpaper} />
            ))}
          </div>
        </section>

        {/* ── API Keys ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-3.5 h-3.5 text-desktop-accent" strokeWidth={1.75} />
            <span className="text-ink-2 text-xs font-medium">API Keys</span>
          </div>
          <div className="app-card space-y-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Anthropic API Key</label>
              <div className="relative">
                <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-…" className="app-input pr-9 font-mono" />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/5 rounded transition-colors">
                  {showKey ? <EyeOff className="w-3.5 h-3.5 text-ink-3" /> : <Eye className="w-3.5 h-3.5 text-ink-3" />}
                </button>
              </div>
              <p className="text-ink-4 text-[11px] mt-1.5 leading-relaxed">
                Required for Claude integration.{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-desktop-accent/70 hover:text-desktop-accent transition-colors">
                  console.anthropic.com
                </a>
              </p>
            </div>

            <div className="flex gap-2 p-3 rounded-lg" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <Info className="w-3.5 h-3.5 text-state-info flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(96,165,250,0.8)' }}>
                API Key 存储在浏览器本地。生产环境请通过 <span className="font-mono">ANTHROPIC_API_KEY</span> 环境变量配置。
              </p>
            </div>

            <div className="mt-3">
              <label className="text-ink-3 text-xs mb-1.5 block">NexusOS API Key</label>
              <div className="relative">
                <input type={showNexusKey ? 'text' : 'password'} value={nexusApiKey} onChange={e => setNexusApiKey(e.target.value)}
                  placeholder="your-secret-api-key" className="app-input pr-9 font-mono" />
                <button onClick={() => setShowNexusKey(!showNexusKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/5 rounded transition-colors">
                  {showNexusKey ? <EyeOff className="w-3.5 h-3.5 text-ink-3" /> : <Eye className="w-3.5 h-3.5 text-ink-3" />}
                </button>
              </div>
              <p className="text-ink-4 text-[11px] mt-1.5 leading-relaxed">
                用于 API 请求认证。需与服务器 <span className="font-mono">API_KEY</span> 环境变量一致。
              </p>
            </div>
          </div>
        </section>

        {/* ── NexusCore Dispatch ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-3.5 h-3.5 text-desktop-accent" strokeWidth={1.75} />
            <span className="text-ink-2 text-xs font-medium">NexusCore 派活模式</span>
          </div>
          <div className="app-card">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDispatchMode('auto')}
                className="px-3 py-2 rounded-lg text-xs transition-colors"
                style={{
                  background: dispatchMode === 'auto' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                  border: dispatchMode === 'auto' ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  color: dispatchMode === 'auto' ? '#86efac' : 'rgba(161,161,170,1)',
                }}
              >
                自动执行
              </button>
              <button
                onClick={() => setDispatchMode('confirm')}
                className="px-3 py-2 rounded-lg text-xs transition-colors"
                style={{
                  background: dispatchMode === 'confirm' ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.04)',
                  border: dispatchMode === 'confirm' ? '1px solid rgba(96,165,250,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  color: dispatchMode === 'confirm' ? '#93c5fd' : 'rgba(161,161,170,1)',
                }}
              >
                确认后执行
              </button>
            </div>
            <p className="text-[11px] text-ink-4 mt-2 leading-relaxed">
              自动执行：主助手识别后立即派活。确认后执行：先给方案，由你确认再执行。
            </p>
          </div>
        </section>

        {/* ── About ── */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
            <span className="text-ink-2 text-xs font-medium">About</span>
          </div>
          <div className="app-card space-y-2">
            {[
              ['NexusOS', 'v0.1.0'],
              ['Frontend', 'React 18 · Vite · Zustand'],
              ['Backend', 'Fastify · Socket.IO · SQLite'],
              ['AI', 'Anthropic Claude'],
              ['Sandbox', 'Node.js Process / Docker'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-ink-3 text-xs">{label}</span>
                <span className="text-ink-2 text-xs font-mono">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <button onClick={handleSave} className="btn-primary w-full justify-center py-2.5">
          {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
