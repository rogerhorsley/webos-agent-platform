import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { Copy, Check, Maximize2 } from 'lucide-react'
import { MediaLightbox } from './MediaLightbox'

// Dark theme matching the app's aesthetic
const codeTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    background: 'transparent',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: '12.5px',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    background: 'transparent',
    margin: 0,
    padding: 0,
    overflow: 'auto',
  },
  comment: { color: '#64748b', fontStyle: 'italic' },
  punctuation: { color: '#94a3b8' },
  property: { color: '#7dd3fc' },
  tag: { color: '#f472b6' },
  boolean: { color: '#fb923c' },
  number: { color: '#fb923c' },
  constant: { color: '#fb923c' },
  symbol: { color: '#a78bfa' },
  deleted: { color: '#f87171' },
  selector: { color: '#a3e635' },
  'attr-name': { color: '#7dd3fc' },
  string: { color: '#86efac' },
  char: { color: '#86efac' },
  builtin: { color: '#a78bfa' },
  inserted: { color: '#86efac' },
  operator: { color: '#94a3b8' },
  entity: { color: '#fb923c' },
  url: { color: '#7dd3fc', textDecoration: 'underline' },
  variable: { color: '#e2e8f0' },
  atrule: { color: '#a78bfa' },
  'attr-value': { color: '#86efac' },
  function: { color: '#60a5fa' },
  'class-name': { color: '#f9a8d4' },
  keyword: { color: '#c084fc' },
  regex: { color: '#fb923c' },
  important: { color: '#fb923c', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
}

interface CodeBlockProps {
  language?: string
  children: string
  inline?: boolean
}

export function CodeBlock({ language, children, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const code = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded text-[12px] font-mono text-[#86efac]"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {children}
      </code>
    )
  }

  const lang = language?.replace(/^language-/, '') || 'text'
  const lineCount = code.split('\n').length
  const isLong = lineCount > 20

  const highlightedCode = (
    <SyntaxHighlighter
      language={lang === 'text' ? 'plaintext' : lang}
      style={codeTheme}
      showLineNumbers={lineCount > 3}
      lineNumberStyle={{ color: '#374151', fontSize: '11px', minWidth: '2.5em' }}
      wrapLongLines={false}
      customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
      codeTagProps={{ style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" } }}
    >
      {code}
    </SyntaxHighlighter>
  )

  return (
    <>
      <div
        className="group relative my-3 rounded-xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[11px] font-mono text-ink-4 select-none">{lang}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-ink-4 hover:text-ink-2 hover:bg-white/5 transition-colors"
              title="全屏预览"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-ink-4 hover:text-ink-2 hover:bg-white/5 transition-colors"
            >
              {copied
                ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">已复制</span></>
                : <><Copy className="w-3 h-3" /><span>复制</span></>
              }
            </button>
          </div>
        </div>

        {/* Code content — collapse if very long */}
        <div
          className="overflow-auto px-4 py-3 transition-all"
          style={{ maxHeight: isLong ? '360px' : 'none' }}
        >
          {highlightedCode}
        </div>

        {/* Gradient fade + expand hint for long code */}
        {isLong && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-2 cursor-pointer"
            style={{ height: '60px', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))' }}
            onClick={() => setExpanded(true)}
          >
            <span className="text-[11px] text-ink-4 hover:text-ink-2">点击展开 {lineCount} 行 ↗</span>
          </div>
        )}
      </div>

      {/* Full-screen code lightbox */}
      <MediaLightbox
        open={expanded}
        onClose={() => setExpanded(false)}
        title={lang}
        downloadUrl={`data:text/plain;charset=utf-8,${encodeURIComponent(code)}`}
        downloadName={`code.${lang}`}
      >
        <div
          className="rounded-xl overflow-auto"
          style={{
            background: 'rgba(10,10,15,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '85vw',
            maxHeight: '85vh',
            minWidth: '600px',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 sticky top-0"
            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[12px] font-mono text-ink-4">{lang} · {lineCount} 行</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-ink-3 hover:text-ink-1 hover:bg-white/5 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div className="px-5 py-4">
            <SyntaxHighlighter
              language={lang === 'text' ? 'plaintext' : lang}
              style={codeTheme}
              showLineNumbers
              lineNumberStyle={{ color: '#374151', fontSize: '12px', minWidth: '3em' }}
              wrapLongLines={false}
              customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
              codeTagProps={{ style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px' } }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </MediaLightbox>
    </>
  )
}
