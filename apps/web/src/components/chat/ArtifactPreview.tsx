import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Code2, Image as ImageIcon, Film, X, Maximize2, Minimize2,
  Layers, ChevronLeft, ChevronRight,
} from 'lucide-react'

export interface Artifact {
  id: string
  type: 'html' | 'svg' | 'image' | 'video' | 'react'
  title: string
  content: string
  language?: string
}

export function extractArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = []
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1].toLowerCase()
    const code = match[2].trim()

    if (lang === 'html' || lang === 'htm') {
      artifacts.push({
        id: `html-${match.index}`,
        type: 'html',
        title: extractTitle(code, 'HTML Preview'),
        content: code,
        language: 'html',
      })
    } else if (lang === 'svg') {
      artifacts.push({
        id: `svg-${match.index}`,
        type: 'svg',
        title: 'SVG Preview',
        content: code,
        language: 'svg',
      })
    } else if (lang === 'jsx' || lang === 'tsx') {
      if (code.includes('return') && (code.includes('<div') || code.includes('<>'))) {
        artifacts.push({
          id: `react-${match.index}`,
          type: 'react',
          title: extractComponentName(code) || 'React Component',
          content: code,
          language: lang,
        })
      }
    }
  }

  const imgRegex = /!\[([^\]]*)\]\(([^)]+\.(png|jpe?g|gif|webp|svg|avif)(\?[^)]*)?)\)/gi
  let imgMatch
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    artifacts.push({
      id: `img-${imgMatch.index}`,
      type: 'image',
      title: imgMatch[1] || 'Image',
      content: imgMatch[2],
    })
  }

  const vidRegex = /!\[([^\]]*)\]\(([^)]+\.(mp4|webm|ogg|mov)(\?[^)]*)?)\)/gi
  let vidMatch
  while ((vidMatch = vidRegex.exec(content)) !== null) {
    artifacts.push({
      id: `vid-${vidMatch.index}`,
      type: 'video',
      title: vidMatch[1] || 'Video',
      content: vidMatch[2],
    })
  }

  return artifacts
}

function extractTitle(html: string, fallback: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  if (titleMatch) return titleMatch[1]
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  if (h1Match) return h1Match[1].replace(/<[^>]+>/g, '')
  return fallback
}

function extractComponentName(code: string): string | null {
  const match = code.match(/(?:function|const)\s+(\w+)/)
  return match ? match[1] : null
}

function buildHtmlDocument(content: string): string {
  if (content.includes('<!DOCTYPE') || content.includes('<html')) return content
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a1a; padding: 16px; }
    img, video { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${content}
</body>
</html>`
}

function buildSvgDocument(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8f9fa;}</style></head>
<body>${content}</body>
</html>`
}

function HtmlPreview({ content, streaming }: { content: string; streaming?: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const doc = useMemo(() => buildHtmlDocument(content), [content])

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        srcDoc={doc}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
        title="HTML Preview"
      />
      {streaming && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-white text-[10px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          实时更新中
        </div>
      )}
    </div>
  )
}

function SvgPreview({ content }: { content: string }) {
  const doc = useMemo(() => buildSvgDocument(content), [content])
  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <iframe srcDoc={doc} sandbox="allow-scripts" className="w-full h-full border-0" title="SVG Preview" />
    </div>
  )
}

function ImagePreview({ src, title }: { src: string; title: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg overflow-hidden p-4">
      <img src={src} alt={title} className="max-w-full max-h-full object-contain rounded shadow-lg" />
    </div>
  )
}

function VideoPreview({ src }: { src: string; title: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
      <video controls autoPlay muted className="max-w-full max-h-full">
        <source src={src} />
        <p className="text-white/50 text-sm">Cannot play video</p>
      </video>
    </div>
  )
}

function ReactPreview({ content }: { content: string }) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#fff;color:#1a1a1a;}</style>
</head><body>
<div id="root"></div>
<script>
try {
  document.getElementById('root').innerHTML = '<div style="padding:20px;text-align:center;color:#666;">' +
    '<p style="font-size:14px;">React Component Preview</p>' +
    '<pre style="text-align:left;background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px;overflow:auto;">' +
    ${JSON.stringify(content.replace(/</g, '&lt;').replace(/>/g, '&gt;'))} + '</pre></div>';
} catch(e) { document.getElementById('root').innerHTML = '<p style="color:red;">Error: ' + e.message + '</p>'; }
</script></body></html>`
  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <iframe srcDoc={html} sandbox="allow-scripts" className="w-full h-full border-0" title="React Preview" />
    </div>
  )
}

export function ArtifactPreview({ artifacts, streaming, onClose }: {
  artifacts: Artifact[]
  streaming?: boolean
  onClose: () => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (artifacts.length > 0 && activeIdx >= artifacts.length) {
      setActiveIdx(artifacts.length - 1)
    }
  }, [artifacts.length])

  useEffect(() => {
    setActiveIdx(artifacts.length - 1)
  }, [artifacts.length])

  if (artifacts.length === 0) return null

  const active = artifacts[Math.min(activeIdx, artifacts.length - 1)]
  if (!active) return null

  const typeIcon = active.type === 'html' ? <Code2 className="w-3.5 h-3.5" />
    : active.type === 'svg' ? <Layers className="w-3.5 h-3.5" />
    : active.type === 'image' ? <ImageIcon className="w-3.5 h-3.5" />
    : active.type === 'video' ? <Film className="w-3.5 h-3.5" />
    : <Code2 className="w-3.5 h-3.5" />

  const typeLabel = active.type === 'html' ? 'HTML'
    : active.type === 'svg' ? 'SVG'
    : active.type === 'image' ? 'Image'
    : active.type === 'video' ? 'Video'
    : 'React'

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-[100] flex flex-col bg-black/95'
    : 'flex flex-col h-full'

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 flex-shrink-0 bg-black/30">
        <span className="text-desktop-accent">{typeIcon}</span>
        <span className="text-white/80 text-xs font-medium truncate flex-1">{active.title}</span>
        <span className="text-white/30 text-[10px] px-1.5 py-0.5 rounded bg-white/5">{typeLabel}</span>

        {artifacts.length > 1 && (
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={activeIdx === 0}
              className="p-0.5 hover:bg-white/10 rounded disabled:opacity-20 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-white/60" />
            </button>
            <span className="text-white/40 text-[10px]">{activeIdx + 1}/{artifacts.length}</span>
            <button onClick={() => setActiveIdx(i => Math.min(artifacts.length - 1, i + 1))} disabled={activeIdx >= artifacts.length - 1}
              className="p-0.5 hover:bg-white/10 rounded disabled:opacity-20 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
        )}

        <button onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          {isFullscreen
            ? <Minimize2 className="w-3.5 h-3.5 text-white/50" />
            : <Maximize2 className="w-3.5 h-3.5 text-white/50" />}
        </button>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-3.5 h-3.5 text-white/50" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden p-2 min-h-0">
        {active.type === 'html' && <HtmlPreview content={active.content} streaming={streaming} />}
        {active.type === 'svg' && <SvgPreview content={active.content} />}
        {active.type === 'image' && <ImagePreview src={active.content} title={active.title} />}
        {active.type === 'video' && <VideoPreview src={active.content} title={active.title} />}
        {active.type === 'react' && <ReactPreview content={active.content} />}
      </div>
    </div>
  )
}
