import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send, Bot, User, ChevronDown, Loader2, AlertCircle, Sparkles,
  Paperclip, X, Image as ImageIcon, FileText, Volume2, Video, Square, CheckCircle2, Play,
  PanelRightOpen, PanelRightClose,
} from 'lucide-react'
import { getSocket } from '../../lib/socket'
import { useAgents } from '../../hooks/useAgents'
import { MessageContent } from '../chat/MessageContent'
import { ArtifactPreview, extractArtifacts } from '../chat/ArtifactPreview'
import { tasksApi, teamsApi } from '../../lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Attachment {
  id: string
  type: 'image' | 'audio' | 'video' | 'file'
  name: string
  url: string        // object URL or data URL
  mimeType: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  streaming?: boolean
  attachments?: Attachment[]
  dispatch?: DispatchDirective
  dispatchState?: 'idle' | 'running' | 'completed' | 'failed'
  dispatchTaskId?: string
  dispatchError?: string
}

interface DispatchDirective {
  action: 'dispatch'
  mode: 'auto' | 'confirm'
  target: { type: 'agent' | 'team'; id: string }
  task: { name: string; prompt: string; context?: string }
  communicationMode?: 'sequential' | 'parallel' | 'hierarchical'
  reason?: string
}

// ─── Attachment thumbnail ─────────────────────────────────────────────────────

function AttachmentPreview({ att, onRemove }: { att: Attachment; onRemove?: () => void }) {
  const icon = att.type === 'image' ? <ImageIcon className="w-3.5 h-3.5" />
    : att.type === 'audio' ? <Volume2 className="w-3.5 h-3.5" />
    : att.type === 'video' ? <Video className="w-3.5 h-3.5" />
    : <FileText className="w-3.5 h-3.5" />

  return (
    <div
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ink-2 group"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {att.type === 'image'
        ? <img src={att.url} alt={att.name} className="w-8 h-8 rounded object-cover" />
        : <span className="text-ink-3">{icon}</span>
      }
      <span className="max-w-[80px] truncate text-ink-3">{att.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-2.5 h-2.5 text-white" />
        </button>
      )}
    </div>
  )
}

// ─── ChatApp ──────────────────────────────────────────────────────────────────

export function ChatApp() {
  const { data: agents = [] } = useAgents()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const latestAssistantContent = useMemo(() => {
    const assistantMsgs = messages.filter(m => m.role === 'assistant' && m.content)
    return assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1].content : ''
  }, [messages])

  const currentArtifacts = useMemo(() => extractArtifacts(latestAssistantContent), [latestAssistantContent])

  useEffect(() => {
    if (currentArtifacts.length > 0 && !showPreview) {
      setShowPreview(true)
    }
  }, [currentArtifacts.length])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingIdRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId)
  const dispatchMode = (localStorage.getItem('nexus_dispatch_mode') as 'auto' | 'confirm') || 'auto'
  const dispatchModeRef = useRef(dispatchMode)
  dispatchModeRef.current = dispatchMode

  useEffect(() => {
    if (!agents.length || selectedAgentId) return
    const nexusCore = agents.find((a: any) => a.id === 'nexus-core')
    setSelectedAgentId(nexusCore?.id || agents[0].id)
  }, [agents, selectedAgentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [input])

  // Socket events
  useEffect(() => {
    const socket = getSocket()
    const onToken = (data: { token: string }) => {
      if (!streamingIdRef.current) return
      setMessages(prev => prev.map(m =>
        m.id === streamingIdRef.current ? { ...m, content: m.content + data.token } : m
      ))
    }
    const onDone = (data: { content?: string; dispatch?: DispatchDirective }) => {
      const mode = dispatchModeRef.current
      setMessages(prev => prev.map(m =>
        m.id === streamingIdRef.current
          ? {
              ...m,
              streaming: false,
              dispatch: data.dispatch || undefined,
              dispatchState: data.dispatch ? (mode === 'auto' ? 'running' : 'idle') : undefined,
            }
          : m
      ))
      const completedMessageId = streamingIdRef.current
      streamingIdRef.current = null
      setIsStreaming(false)

      if (data.dispatch && completedMessageId && mode === 'auto') {
        void executeDispatch(data.dispatch, completedMessageId)
      }
    }
    const onError = (data: { error: string }) => {
      setError(data.error)
      setMessages(prev => prev.map(m =>
        m.id === streamingIdRef.current ? { ...m, streaming: false } : m
      ))
      streamingIdRef.current = null
      setIsStreaming(false)
    }
    const onStopped = () => {
      setMessages(prev => prev.map(m =>
        m.id === streamingIdRef.current ? { ...m, streaming: false } : m
      ))
      streamingIdRef.current = null
      setIsStreaming(false)
    }
    socket.on('chat:token', onToken)
    socket.on('chat:done', onDone)
    socket.on('chat:error', onError)
    socket.on('chat:stopped', onStopped)
    return () => {
      socket.off('chat:token', onToken)
      socket.off('chat:done', onDone)
      socket.off('chat:error', onError)
      socket.off('chat:stopped', onStopped)
    }
  }, [])

  const executeDispatch = useCallback(async (dispatch: DispatchDirective, messageId: string) => {
    try {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, dispatchState: 'running', dispatchError: undefined } : m))

      if (dispatch.target.type === 'team') {
        const teamRun = await teamsApi.run(dispatch.target.id, {
          name: dispatch.task.name,
          prompt: [dispatch.task.prompt, dispatch.task.context].filter(Boolean).join('\n\n'),
          priority: 'medium',
        })
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? { ...m, dispatchState: 'completed', dispatchTaskId: teamRun.taskId }
            : m
        ))
        return
      }

      const created = await tasksApi.create({
        name: dispatch.task.name,
        description: dispatch.reason || '',
        type: 'chat',
        priority: 'medium',
        agentId: dispatch.target.id,
        input: {
          prompt: [dispatch.task.prompt, dispatch.task.context].filter(Boolean).join('\n\n'),
        },
      })
      await tasksApi.start(created.id)

      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, dispatchState: 'completed', dispatchTaskId: created.id }
          : m
      ))
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, dispatchState: 'failed', dispatchError: err.message || 'Dispatch failed' }
          : m
      ))
    }
  }, [])

  // ── File handling ──────────────────────────────────────────────────────────

  const classifyFile = (file: File): Attachment['type'] => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('audio/')) return 'audio'
    if (file.type.startsWith('video/')) return 'video'
    return 'file'
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      const att: Attachment = {
        id: Math.random().toString(36).slice(2),
        type: classifyFile(file),
        name: file.name,
        url,
        mimeType: file.type,
      }
      setAttachments(prev => [...prev, att])
    })
  }, [])

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id)
      if (att) URL.revokeObjectURL(att.url)
      return prev.filter(a => a.id !== id)
    })
  }

  // Paste image from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'))
    if (files.length) addFiles(files)
  }, [addFiles])

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return
    setError(null)

    // Build user message content: text + attachment inline refs
    let userContent = input.trim()
    attachments.forEach(att => {
      if (att.type === 'image') userContent += `\n\n![${att.name}](${att.url})`
      else if (att.type === 'video') userContent += `\n\n[${att.name}](${att.url})`
      else if (att.type === 'audio') userContent += `\n\n[${att.name}](${att.url})`
      else userContent += `\n\n[${att.name}](${att.url})`
    })

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      attachments: [...attachments],
    }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      agentId: selectedAgentId,
      streaming: true,
    }
    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setInput('')
    setAttachments([])
    setIsStreaming(true)
    streamingIdRef.current = assistantId

    const socket = getSocket()
    socket.emit('chat:message', {
      agentId: selectedAgentId || undefined,
      messages: history.map(m => ({ role: m.role, content: m.content })),
      systemPrompt: selectedAgent?.systemPrompt,
      model: selectedAgent?.config?.model,
      dispatchMode,
    })
  }, [input, attachments, isStreaming, messages, selectedAgentId, selectedAgent, dispatchMode])

  const handleStop = useCallback(() => {
    const socket = getSocket()
    socket.emit('chat:stop')
  }, [])

  const sendEditPrompt = useCallback((prompt: string) => {
    if (isStreaming) return
    setError(null)
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: prompt }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', agentId: selectedAgentId, streaming: true }
    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setIsStreaming(true)
    streamingIdRef.current = assistantId
    const socket = getSocket()
    socket.emit('chat:message', {
      agentId: selectedAgentId || undefined,
      messages: history.map(m => ({ role: m.role, content: m.content })),
      systemPrompt: selectedAgent?.systemPrompt,
      model: selectedAgent?.config?.model,
      dispatchMode,
    })
  }, [isStreaming, messages, selectedAgentId, selectedAgent, dispatchMode])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex">
      {/* ── Chat panel ── */}
      <div
        className={`flex flex-col gap-3 h-full ${showPreview && currentArtifacts.length > 0 ? 'w-1/2 border-r border-white/10 pr-1' : 'w-full'}`}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
      {/* Agent selector */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-desktop-accent flex-shrink-0" strokeWidth={1.75} />
        <span className="text-ink-3 text-xs">Agent:</span>
        <div className="relative">
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            className="pl-2.5 pr-6 py-1 text-xs rounded-lg appearance-none cursor-pointer text-ink-1 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <option value="">Default</option>
            {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown className="w-3 h-3 text-ink-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {selectedAgent?.config?.model && (
          <span className="text-ink-4 text-[11px] font-mono">{selectedAgent.config.model}</span>
        )}
        {selectedAgentId === 'nexus-core' && (
          <span className="badge text-[10px] text-emerald-300 bg-emerald-500/10 border-emerald-500/20">主助手</span>
        )}
        {currentArtifacts.length > 0 && (
          <button onClick={() => setShowPreview(p => !p)}
            className="ml-auto p-1.5 hover:bg-white/5 rounded-lg transition-colors" title={showPreview ? '隐藏预览' : '显示预览'}>
            {showPreview ? <PanelRightClose className="w-3.5 h-3.5 text-desktop-accent" /> : <PanelRightOpen className="w-3.5 h-3.5 text-ink-3" />}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-4 min-h-0 pr-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-ink-4 select-none">
            <Bot className="w-8 h-8 mb-2 opacity-30" strokeWidth={1.5} />
            <p className="text-sm text-ink-3">开始对话</p>
            <p className="text-xs mt-1 text-ink-4">支持 Markdown · 代码高亮 · 图片/视频/音频</p>
            {selectedAgent?.systemPrompt && (
              <p className="text-xs mt-2 max-w-xs text-center text-ink-4 italic leading-relaxed">
                "{selectedAgent.systemPrompt}"
              </p>
            )}
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`msg-bubble flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform hover:scale-110 ${
              message.role === 'user' ? 'bg-desktop-accent' : 'bg-white/8'
            }`}>
              {message.role === 'user'
                ? <User className="w-3 h-3 text-white" strokeWidth={2} />
                : <Bot className="w-3 h-3 text-ink-2" strokeWidth={1.75} />
              }
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed transition-colors ${
                message.role === 'user'
                  ? 'bg-desktop-accent text-white rounded-tr-sm'
                  : 'text-ink-1 rounded-tl-sm'
              }`}
              style={message.role === 'assistant'
                ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }
                : {}
              }
            >
              {/* Streaming placeholder */}
              {message.streaming && !message.content && (
                <span className="flex items-center gap-1.5 text-ink-3">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">思考中…</span>
                </span>
              )}

              {/* Content */}
              {message.content && (
                <MessageContent content={message.content} streaming={message.streaming} />
              )}

              {/* Streaming cursor */}
              {message.streaming && message.content && (
                <span className="inline-block w-0.5 h-3.5 bg-ink-2/60 ml-0.5 animate-pulse" />
              )}

              {/* NexusCore dispatch card */}
              {message.dispatch && (
                <div
                  className="mt-2.5 rounded-lg p-2.5 space-y-1.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="text-[11px] text-ink-3">
                    派活目标：
                    <span className="text-ink-2 ml-1 font-medium">
                      {message.dispatch.target.type === 'team' ? 'Team' : 'Agent'} · {message.dispatch.target.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-4">{message.dispatch.task.name}</div>
                  {message.dispatch.reason ? (
                    <div className="text-[11px] text-ink-4 leading-relaxed">{message.dispatch.reason}</div>
                  ) : null}

                  <div className="flex items-center gap-2 pt-1">
                    {message.dispatchState === 'idle' ? (
                      <button
                        onClick={() => executeDispatch(message.dispatch!, message.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-state-success"
                        style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}
                      >
                        <Play className="w-3 h-3" /> 确认执行
                      </button>
                    ) : null}
                    {message.dispatchState === 'running' ? (
                      <span className="flex items-center gap-1 text-[11px] text-state-info">
                        <Loader2 className="w-3 h-3 animate-spin" /> 执行中...
                      </span>
                    ) : null}
                    {message.dispatchState === 'completed' ? (
                      <span className="flex items-center gap-1 text-[11px] text-state-success">
                        <CheckCircle2 className="w-3 h-3" /> 已创建任务 {message.dispatchTaskId?.slice(0, 8)}
                      </span>
                    ) : null}
                    {message.dispatchState === 'failed' ? (
                      <span className="text-[11px] text-state-error">执行失败：{message.dispatchError}</span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-state-error text-xs flex-shrink-0 animate-slideUp cursor-pointer"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}
          onClick={() => setError(null)}
          title="点击关闭"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <X className="w-3 h-3 flex-shrink-0 opacity-50 hover:opacity-100" />
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          {attachments.map(att => (
            <AttachmentPreview key={att.id} att={att} onRemove={() => removeAttachment(att.id)} />
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex gap-2 flex-shrink-0 items-end rounded-xl p-1.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg text-ink-4 hover:text-ink-2 hover:bg-white/5 transition-colors flex-shrink-0"
          title="附加文件 (图片/视频/音频)"
          disabled={isStreaming}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          onPaste={handlePaste}
          placeholder={isStreaming ? '生成中… (点击 ■ 停止)' : '输入消息… (Enter 发送，Shift+Enter 换行，可粘贴图片)'}
          disabled={isStreaming}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-ink-1 placeholder-ink-4 outline-none disabled:opacity-40 py-1 px-1"
          style={{ minHeight: '30px', maxHeight: '120px' }}
        />

        {/* Stop / Send button */}
        {isStreaming ? (
          <button
            onClick={handleStop}
            className="p-2 flex-shrink-0 rounded-lg text-white transition-colors"
            style={{ background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.35)' }}
            title="停止生成"
          >
            <Square className="w-4 h-4 text-red-400 fill-red-400" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0}
            className="btn-primary p-2 flex-shrink-0 disabled:opacity-40 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
      </div>

      {/* ── Artifact preview panel ── */}
      {showPreview && currentArtifacts.length > 0 && (
        <div className="w-1/2 h-full pl-1">
          <ArtifactPreview
            artifacts={currentArtifacts}
            streaming={isStreaming}
            onClose={() => setShowPreview(false)}
            onEditSave={(prompt) => {
              sendEditPrompt(prompt)
            }}
          />
        </div>
      )}
    </div>
  )
}
