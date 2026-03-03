import { useState } from 'react'
import { Save, Eye, EyeOff, CheckCircle, Key, Info } from 'lucide-react'

export function SettingsApp() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('anthropic_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-md mx-auto space-y-5 py-1">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Settings</h2>
          <p className="text-ink-3 text-xs mt-0.5">Configure NexusOS preferences</p>
        </div>

        {/* API Keys */}
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
          </div>
        </section>

        {/* About */}
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
