import { useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Download } from 'lucide-react'

interface MediaLightboxProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  downloadUrl?: string
  downloadName?: string
}

export function MediaLightbox({ open, onClose, children, title, downloadUrl, downloadName }: MediaLightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2"
        onClick={e => e.stopPropagation()}
      >
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="下载"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      {title && (
        <div className="absolute top-4 left-4 text-white/60 text-sm font-mono truncate max-w-xs">
          {title}
        </div>
      )}

      {/* Content */}
      <div
        className="max-w-[90vw] max-h-[90vh] overflow-auto rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

// Specialized image lightbox with zoom
interface ImageLightboxProps {
  open: boolean
  onClose: () => void
  src: string
  alt?: string
}

export function ImageLightbox({ open, onClose, src, alt }: ImageLightboxProps) {
  return (
    <MediaLightbox open={open} onClose={onClose} title={alt} downloadUrl={src} downloadName={alt}>
      <img
        src={src}
        alt={alt}
        className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg select-none"
        style={{ boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
      />
    </MediaLightbox>
  )
}
