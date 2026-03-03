import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, ChevronDown, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { getSocket } from '../../lib/socket'
import { useAgents } from '../../hooks/useAgents'

interface Message {
  id: string; role: 'user' | 'assistant'; content: string; agentId?: string; streaming?: boolean
}

export function ChatApp() {
  const { data: agents = [] } = useAgents()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingIdRef = useRef<string | null>(null)
  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId)

  useEffect(() => { if (agents.length > 0 && !selectedAgentId) setSelectedAgentId(agents[0].id) }, [agents, selectedAgentId])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const socket = getSocket()
    const onToken = (data: { token: string }) => {
      if (!streamingIdRef.current) return
      setMessages(prev => prev.map(m => m.id === streamingIdRef.current ? { ...m, content: m.content + data.token } : m))
    }
    const onDone = () => {
      setMessages(prev => prev.map(m => m.id === streamingIdRef.current ? { ...m, streaming: false } : m))
      streamingIdRef.current = null; setIsStreaming(false)
    }
    const onError = (data: { error: string }) => {
      setError(data.error)
      setMessages(prev => prev.map(m => m.id === streamingIdRef.current ? { ...m, streaming: false } : m))
      streamingIdRef.current = null; setIsStreaming(false)
    }
    socket.on('chat:token', onToken); socket.on('chat:done', onDone); socket.on('chat:error', onError)
    return () => { socket.off('chat:token', onToken); socket.off('chat:done', onDone); socket.off('chat:error', onError) }
  }, [])

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return
    setError(null)
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', agentId: selectedAgentId, streaming: true }
    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setInput(''); setIsStreaming(true); streamingIdRef.current = assistantId
    const socket = getSocket()
    socket.emit('chat:message', {
      agentId: selectedAgentId || undefined,
      messages: history.map(m => ({ role: m.role, content: m.content })),
      systemPrompt: selectedAgent?.systemPrompt,
      model: selectedAgent?.config?.model,
    })
  }, [input, isStreaming, messages, selectedAgentId, selectedAgent])

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Agent selector bar */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-desktop-accent flex-shrink-0" strokeWidth={1.75} />
        <span className="text-ink-3 text-xs">Agent:</span>
        <div className="relative">
          <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
            className="pl-2.5 pr-6 py-1 text-xs rounded-lg appearance-none cursor-pointer text-ink-1 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="">Default</option>
            {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown className="w-3 h-3 text-ink-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {selectedAgent?.config?.model && (
          <span className="text-ink-4 text-[11px] font-mono">{selectedAgent.config.model}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-ink-4 select-none">
            <Bot className="w-8 h-8 mb-2 opacity-30" strokeWidth={1.5} />
            <p className="text-sm text-ink-3">开始对话</p>
            {selectedAgent?.systemPrompt && (
              <p className="text-xs mt-1.5 max-w-xs text-center text-ink-4 italic leading-relaxed">
                "{selectedAgent.systemPrompt}"
              </p>
            )}
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              message.role === 'user' ? 'bg-desktop-accent' : 'bg-white/8'
            }`}>
              {message.role === 'user'
                ? <User className="w-3 h-3 text-white" strokeWidth={2} />
                : <Bot className="w-3 h-3 text-ink-2" strokeWidth={1.75} />
              }
            </div>
            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-desktop-accent text-white rounded-tr-sm'
                : 'text-ink-1 rounded-tl-sm'
            }`}
              style={message.role === 'assistant' ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' } : {}}
            >
              {message.content || (message.streaming && (
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">思考中…</span>
                </span>
              ))}
              {message.streaming && message.content && (
                <span className="inline-block w-0.5 h-3.5 bg-ink-2/60 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-state-error text-xs flex-shrink-0" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={isStreaming ? '等待响应…' : '输入消息… (Enter 发送，Shift+Enter 换行)'}
          disabled={isStreaming}
          rows={1}
          className="app-input flex-1 resize-none disabled:opacity-40"
          style={{ minHeight: '36px', maxHeight: '120px' }}
        />
        <button onClick={handleSend} disabled={!input.trim() || isStreaming} className="btn-primary px-3 flex-shrink-0 disabled:opacity-40">
          {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
