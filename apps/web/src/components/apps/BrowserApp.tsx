import { useState, useRef, useCallback } from 'react'
import {
  Globe, ArrowLeft, ArrowRight, RotateCw, Loader2, MousePointer, Type,
  X, AlertCircle,
} from 'lucide-react'
import {
  useCreateBrowserSession, useBrowserNavigate, useBrowserClick,
  useBrowserType, useBrowserBack, useBrowserForward, useBrowserRefresh,
  useBrowserKeyPress,
} from '../../hooks/useBrowser'

type Mode = 'navigate' | 'click' | 'type'

export function BrowserApp() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [url, setUrl] = useState('https://www.google.com')
  const [currentUrl, setCurrentUrl] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('navigate')
  const [typeText, setTypeText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const createSession = useCreateBrowserSession()
  const navigate = useBrowserNavigate()
  const click = useBrowserClick()
  const type_ = useBrowserType()
  const back = useBrowserBack()
  const forward = useBrowserForward()
  const refresh = useBrowserRefresh()
  const keyPress = useBrowserKeyPress()

  const loading = createSession.isPending || navigate.isPending || click.isPending ||
    type_.isPending || back.isPending || forward.isPending || refresh.isPending || keyPress.isPending

  const updateFromResult = useCallback((result: { screenshot?: string; title?: string; url?: string }) => {
    if (result.screenshot) setScreenshot(result.screenshot)
    if (result.title) setPageTitle(result.title)
    if (result.url) setCurrentUrl(result.url)
    setError(null)
  }, [])

  const handleStart = async () => {
    try {
      setError(null)
      const { sessionId: sid } = await createSession.mutateAsync()
      setSessionId(sid)
      const result = await navigate.mutateAsync({ sessionId: sid, url })
      updateFromResult(result)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleNavigate = async () => {
    if (!sessionId) return
    try {
      const result = await navigate.mutateAsync({ sessionId, url })
      updateFromResult(result)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sessionId || mode !== 'click' || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const scaleX = 1280 / rect.width
    const scaleY = 800 / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    try {
      const result = await click.mutateAsync({ sessionId, x, y })
      updateFromResult(result)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleType = async () => {
    if (!sessionId || !typeText) return
    try {
      const result = await type_.mutateAsync({ sessionId, text: typeText })
      if (result.screenshot) setScreenshot(result.screenshot)
      setTypeText('')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleKey = async (key: string) => {
    if (!sessionId) return
    try {
      const result = await keyPress.mutateAsync({ sessionId, key })
      if (result.screenshot) setScreenshot(result.screenshot)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBack = async () => { if (!sessionId) return; try { updateFromResult(await back.mutateAsync(sessionId)) } catch (err: any) { setError(err.message) } }
  const handleForward = async () => { if (!sessionId) return; try { updateFromResult(await forward.mutateAsync(sessionId)) } catch (err: any) { setError(err.message) } }
  const handleRefresh = async () => { if (!sessionId) return; try { updateFromResult(await refresh.mutateAsync(sessionId)) } catch (err: any) { setError(err.message) } }

  if (!sessionId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/30">
        <Globe className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm mb-4">Start a browser session</p>
        <div className="flex items-center gap-2 w-96">
          <input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="https://..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-white/20 focus:outline-none font-mono" />
          <button onClick={handleStart} disabled={loading}
            className="px-4 py-2 bg-desktop-accent hover:bg-desktop-accent/80 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />{error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 flex-shrink-0">
        <button onClick={handleBack} disabled={loading} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <button onClick={handleForward} disabled={loading} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30">
          <ArrowRight className="w-4 h-4 text-white/60" />
        </button>
        <button onClick={handleRefresh} disabled={loading} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30">
          <RotateCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNavigate()}
            className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/30 focus:border-white/20 focus:outline-none font-mono" />
          <button onClick={handleNavigate} disabled={loading}
            className="px-3 py-1.5 bg-desktop-accent/20 hover:bg-desktop-accent/40 rounded-lg text-desktop-accent text-xs transition-colors disabled:opacity-50">
            Go
          </button>
        </div>
      </div>

      {/* Mode bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 flex-shrink-0 bg-black/20">
        <span className="text-white/30 text-[10px] uppercase tracking-wide mr-1">Mode:</span>
        <button onClick={() => setMode('click')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${mode === 'click' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
          <MousePointer className="w-3 h-3" /> Click
        </button>
        <button onClick={() => setMode('type')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${mode === 'type' ? 'bg-green-500/20 text-green-400' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
          <Type className="w-3 h-3" /> Type
        </button>

        {mode === 'type' && (
          <div className="flex items-center gap-1 ml-2">
            <input value={typeText} onChange={e => setTypeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleType() }}
              placeholder="Text to type..."
              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs placeholder-white/30 focus:outline-none w-48" />
            <button onClick={handleType} disabled={!typeText || loading}
              className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 text-xs disabled:opacity-50">
              Send
            </button>
            <button onClick={() => handleKey('Enter')} disabled={loading}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/50 text-xs">
              ↵ Enter
            </button>
            <button onClick={() => handleKey('Tab')} disabled={loading}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-white/50 text-xs">
              Tab
            </button>
          </div>
        )}

        <div className="flex-1" />
        {pageTitle && <span className="text-white/30 text-[10px] truncate max-w-[200px]">{pageTitle}</span>}
        {loading && <Loader2 className="w-3 h-3 text-desktop-accent animate-spin" />}
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto bg-black/30 flex items-center justify-center p-2">
        {screenshot ? (
          <img
            ref={imgRef}
            src={`data:image/jpeg;base64,${screenshot}`}
            alt="Browser viewport"
            className={`max-w-full max-h-full rounded shadow-lg ${mode === 'click' ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleImageClick}
            draggable={false}
          />
        ) : (
          <div className="text-white/20 text-sm">Loading...</div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 border-t border-white/10 flex items-center justify-between text-white/30 text-[10px] flex-shrink-0">
        <span className="font-mono truncate max-w-[60%]">{currentUrl}</span>
        <span>Session: {sessionId.slice(0, 8)}</span>
      </div>

      {error && (
        <div className="px-3 py-1.5 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2 text-red-400 text-xs flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-0.5 hover:bg-red-500/20 rounded"><X className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  )
}
