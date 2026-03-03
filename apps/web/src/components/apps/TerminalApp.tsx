import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { io, Socket } from 'socket.io-client'
import { Sparkles, AlertCircle } from 'lucide-react'
import { getSocket } from '../../lib/socket'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function TerminalApp() {
  const termRef = useRef<HTMLDivElement>(null)
  const termInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nlMode, setNlMode] = useState(false)
  const [nlInput, setNlInput] = useState('')
  const [nlLoading, setNlLoading] = useState(false)

  useEffect(() => {
    if (!termRef.current) return

    const term = new Terminal({
      theme: {
        background: '#0C0C0E',
        foreground: '#FAFAFA',
        cursor: '#E84C6A',
        cursorAccent: '#0C0C0E',
        selectionBackground: 'rgba(232,76,106,0.25)',
        black: '#18181B',
        red: '#E84C6A',
        green: '#4ADE80',
        yellow: '#FBBF24',
        blue: '#60A5FA',
        magenta: '#A78BFA',
        cyan: '#22D3EE',
        white: '#A1A1AA',
        brightBlack: '#52525B',
        brightRed: '#FB7185',
        brightGreen: '#86EFAC',
        brightYellow: '#FDE68A',
        brightBlue: '#93C5FD',
        brightMagenta: '#C4B5FD',
        brightCyan: '#67E8F9',
        brightWhite: '#FAFAFA',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 2000,
    })

    const fit = new FitAddon()
    const links = new WebLinksAddon()
    term.loadAddon(fit)
    term.loadAddon(links)
    term.open(termRef.current)
    fit.fit()

    termInstance.current = term
    fitAddon.current = fit

    // Connect to terminal namespace
    const socket = io(`${API_URL}/terminal`, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
      term.write('\r\n\x1b[32mConnected to NexusOS Terminal\x1b[0m\r\n\r\n')
    })

    socket.on('terminal:output', (data: string) => {
      term.write(data)
    })

    socket.on('terminal:exit', ({ exitCode }: { exitCode: number }) => {
      term.write(`\r\n\x1b[33mShell exited with code ${exitCode}\x1b[0m\r\n`)
      setConnected(false)
    })

    socket.on('disconnect', () => {
      setConnected(false)
      term.write('\r\n\x1b[31mDisconnected\x1b[0m\r\n')
    })

    socket.on('connect_error', (err) => {
      setError(`Cannot connect to terminal server: ${err.message}`)
    })

    term.onData((data) => {
      socket.emit('terminal:input', data)
    })

    const resizeObserver = new ResizeObserver(() => {
      fit.fit()
      const { cols, rows } = term
      socket.emit('terminal:resize', { cols, rows })
    })
    resizeObserver.observe(termRef.current)

    return () => {
      resizeObserver.disconnect()
      term.dispose()
      socket.disconnect()
    }
  }, [])

  const handleNlCommand = async () => {
    if (!nlInput.trim() || nlLoading) return
    setNlLoading(true)

    const mainSocket = getSocket()
    let commandBuffer = ''

    const onToken = (data: { token: string }) => {
      commandBuffer += data.token
    }
    const onDone = () => {
      mainSocket.off('chat:token', onToken)
      mainSocket.off('chat:done', onDone)
      const command = commandBuffer.trim().replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
      if (socketRef.current && termInstance.current) {
        socketRef.current.emit('terminal:input', command + '\n')
        termInstance.current.focus()
      }
      setNlInput('')
      setNlLoading(false)
      setNlMode(false)
    }

    mainSocket.on('chat:token', onToken)
    mainSocket.on('chat:done', onDone)
    mainSocket.emit('chat:message', {
      messages: [{
        role: 'user',
        content: `Convert this natural language to a shell command (respond with ONLY the command, no explanation, no markdown): ${nlInput}`,
      }],
      systemPrompt: 'You are a shell command expert. When asked to convert natural language to a command, respond with ONLY the command itself. No explanations, no markdown, no backticks.',
    })
  }

  return (
    <div className="h-full flex flex-col bg-desktop-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-white/40 text-xs">{connected ? 'Connected' : 'Disconnected'}</span>
        <div className="flex-1" />
        <button
          onClick={() => setNlMode(!nlMode)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
            nlMode ? 'bg-desktop-accent/30 text-desktop-accent' : 'bg-white/5 text-white/40 hover:text-white/60'
          }`}
          title="Natural language mode (convert text to command)"
        >
          <Sparkles className="w-3 h-3" />
          NL Mode
        </button>
      </div>

      {/* NL input bar */}
      {nlMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-desktop-accent/10 border-b border-desktop-accent/20 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-desktop-accent flex-shrink-0" />
          <input
            autoFocus
            value={nlInput}
            onChange={e => setNlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNlCommand()}
            placeholder='Describe what you want to do, e.g. "list all files sorted by date"'
            className="flex-1 bg-transparent text-white text-xs placeholder-white/30 focus:outline-none"
            disabled={nlLoading}
          />
          {nlLoading && <span className="text-desktop-accent text-xs">Converting...</span>}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 m-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <p className="text-white/40 ml-1">Make sure the API server is running.</p>
        </div>
      )}

      {/* Terminal */}
      <div ref={termRef} className="flex-1 overflow-hidden p-1" />
    </div>
  )
}
