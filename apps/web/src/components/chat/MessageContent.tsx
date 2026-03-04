import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink, Volume2 } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { ImageLightbox } from './MediaLightbox'

// ─── URL Detectors ───────────────────────────────────────────────────────────

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i.test(url)
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(url)
}

function isAudioUrl(url: string) {
  return /\.(mp3|wav|ogg|aac|flac|m4a|opus)(\?.*)?$/i.test(url)
}

// ─── Inline Image with lightbox ──────────────────────────────────────────────

function InlineImage({ src, alt }: { src: string; alt?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <span className="block my-2">
        <img
          src={src}
          alt={alt}
          className="max-w-full rounded-lg cursor-zoom-in border border-white/10 hover:border-white/25 transition-colors"
          style={{ maxHeight: '320px', objectFit: 'contain' }}
          onClick={() => setOpen(true)}
          title="点击放大"
        />
        {alt && <span className="block text-[11px] text-ink-4 mt-1 italic">{alt}</span>}
      </span>
      <ImageLightbox open={open} onClose={() => setOpen(false)} src={src} alt={alt} />
    </>
  )
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ src, title }: { src: string; title?: string }) {
  return (
    <div className="my-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <video
        controls
        preload="metadata"
        className="w-full max-h-[320px]"
        style={{ background: '#000' }}
      >
        <source src={src} />
        <p className="text-ink-4 text-xs p-3">
          浏览器不支持视频播放，
          <a href={src} className="text-desktop-accent underline" target="_blank" rel="noopener noreferrer">点击下载</a>
        </p>
      </video>
      {title && <div className="px-3 py-1.5 text-[11px] text-ink-4 font-mono truncate" style={{ background: 'rgba(255,255,255,0.03)' }}>{title}</div>}
    </div>
  )
}

// ─── Audio Player ─────────────────────────────────────────────────────────────

function AudioPlayer({ src, title }: { src: string; title?: string }) {
  return (
    <div
      className="my-2 flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Volume2 className="w-4 h-4 text-desktop-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <div className="text-xs text-ink-2 truncate mb-1">{title}</div>}
        <audio controls preload="metadata" className="w-full h-7" style={{ filter: 'invert(0.8)' }}>
          <source src={src} />
        </audio>
      </div>
    </div>
  )
}

// ─── URL Card (auto-detected external links) ──────────────────────────────────

function UrlCard({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http')
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="inline-flex items-center gap-1 text-desktop-accent hover:underline"
    >
      {children}
      {isExternal && <ExternalLink className="w-3 h-3 inline flex-shrink-0 opacity-70" />}
    </a>
  )
}

// ─── Smart Link: detect image/video/audio by URL ────────────────────────────

function SmartLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <span>{children}</span>
  if (isImageUrl(href)) return <InlineImage src={href} alt={String(children)} />
  if (isVideoUrl(href)) return <VideoPlayer src={href} title={String(children)} />
  if (isAudioUrl(href)) return <AudioPlayer src={href} title={String(children)} />
  return <UrlCard href={href}>{children}</UrlCard>
}

// ─── Table wrapper ────────────────────────────────────────────────────────────

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-3 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  )
}

// ─── MessageContent ───────────────────────────────────────────────────────────

interface MessageContentProps {
  content: string
  /** Pass true while streaming to skip full markdown parse (avoids flicker) */
  streaming?: boolean
}

export function MessageContent({ content, streaming }: MessageContentProps) {
  // Detect bare media URLs as the entire message (e.g. user pastes a URL)
  const trimmed = content.trim()
  if (!streaming && isImageUrl(trimmed)) return <InlineImage src={trimmed} />
  if (!streaming && isVideoUrl(trimmed)) return <VideoPlayer src={trimmed} />
  if (!streaming && isAudioUrl(trimmed)) return <AudioPlayer src={trimmed} />

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const isInline = !match && !String(children).includes('\n')
            return (
              <CodeBlock
                language={match?.[1]}
                inline={isInline}
              >
                {String(children)}
              </CodeBlock>
            )
          },

          // Images → lightbox
          img({ src, alt }) {
            if (!src) return null
            return <InlineImage src={src} alt={alt} />
          },

          // Links → smart link (detects media)
          a({ href, children }) {
            return <SmartLink href={href}>{children}</SmartLink>
          },

          // Tables
          table({ children }) { return <TableWrapper>{children}</TableWrapper> },
          thead({ children }) {
            return <thead style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{children}</thead>
          },
          th({ children }) {
            return <th className="px-3 py-2 text-left text-xs font-semibold text-ink-2">{children}</th>
          },
          td({ children }) {
            return <td className="px-3 py-2 text-xs text-ink-1 border-t border-white/[0.05]">{children}</td>
          },

          // Typography
          h1: ({ children }) => <h1 className="text-base font-bold text-ink-1 mt-4 mb-2 pb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold text-ink-1 mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium text-ink-1 mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-ink-1 leading-relaxed my-1.5">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-4 my-1.5 space-y-0.5 text-sm text-ink-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-4 my-1.5 space-y-0.5 text-sm text-ink-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className="pl-3 py-0.5 my-2 text-sm text-ink-3 italic"
              style={{ borderLeft: '3px solid rgba(255,255,255,0.2)' }}
            >
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />,
          strong: ({ children }) => <strong className="font-semibold text-ink-1">{children}</strong>,
          em: ({ children }) => <em className="italic text-ink-2">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
