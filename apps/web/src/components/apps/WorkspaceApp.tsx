import { useState, useCallback, useRef } from 'react'
import {
  FolderOpen, File, ChevronRight, ChevronDown, Terminal, Play, Loader2,
  AlertCircle, RefreshCw, Bot, Sparkles, Cpu,
  Server, CheckCircle, X, Save, Folder, Upload, Trash2,
  Edit3, FolderPlus, FilePlus,
} from 'lucide-react'
import {
  useWorkspacesList, useWorkspaceFiles, useWorkspaceFile,
  useExecInWorkspace, useRunClaude, useWriteWorkspaceFile,
  useDeleteWorkspaceFile, useSandboxInfo,
} from '../../hooks/useWorkspaces'
import { useAgents } from '../../hooks/useAgents'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function getFileIcon(_name: string, type: string) {
  if (type === 'directory') return Folder
  return File
}

function FileNode({ agentId, entry, depth, onSelect, selectedPath, onRefresh, onContextAction }: {
  agentId: string
  entry: any
  depth: number
  onSelect: (path: string, type: string) => void
  selectedPath: string
  onRefresh: () => void
  onContextAction: (action: string, path: string, type: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: children } = useWorkspaceFiles(agentId, expanded && entry.type === 'directory' ? entry.path : '')
  const Icon = getFileIcon(entry.name, entry.type)
  const isSelected = selectedPath === entry.path

  const toggle = () => {
    if (entry.type === 'directory') {
      setExpanded(e => !e)
    } else {
      onSelect(entry.path, 'file')
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer group transition-colors ${
          isSelected ? 'bg-desktop-accent/20 text-white' : 'hover:bg-white/5 text-white/70'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={toggle}
      >
        {entry.type === 'directory' ? (
          expanded ? <ChevronDown className="w-3 h-3 flex-shrink-0 text-white/40" /> : <ChevronRight className="w-3 h-3 flex-shrink-0 text-white/40" />
        ) : <span className="w-3 flex-shrink-0" />}
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${entry.type === 'directory' ? 'text-yellow-400/70' : 'text-blue-400/70'}`} />
        <span className="text-xs flex-1 truncate">{entry.name}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onContextAction('rename', entry.path, entry.type) }}
            className="p-0.5 hover:bg-white/10 rounded" title="Rename">
            <Edit3 className="w-3 h-3 text-white/40" />
          </button>
          <button onClick={e => { e.stopPropagation(); onContextAction('delete', entry.path, entry.type) }}
            className="p-0.5 hover:bg-red-500/20 rounded" title="Delete">
            <Trash2 className="w-3 h-3 text-red-400/60" />
          </button>
        </div>
        {entry.size !== undefined && (
          <span className="text-white/20 text-[10px] opacity-0 group-hover:opacity-100 ml-1">{formatBytes(entry.size)}</span>
        )}
      </div>
      {entry.type === 'directory' && expanded && children && (
        <div>
          {children.map((child: any) => (
            <FileNode
              key={child.path}
              agentId={agentId}
              entry={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              onRefresh={onRefresh}
              onContextAction={onContextAction}
            />
          ))}
          {children.length === 0 && (
            <div className="text-white/20 text-[10px] py-1" style={{ paddingLeft: `${20 + depth * 12}px` }}>empty</div>
          )}
        </div>
      )}
    </div>
  )
}

function FileViewer({ agentId, filePath, onClose }: { agentId: string; filePath: string; onClose: () => void }) {
  const { data: content, isLoading, refetch } = useWorkspaceFile(agentId, filePath)
  const writeFile = useWriteWorkspaceFile()
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const fileName = filePath.split('/').pop() || filePath
  const ext = fileName.split('.').pop()?.toLowerCase()
  const isText = ['md', 'txt', 'json', 'ts', 'tsx', 'js', 'jsx', 'py', 'sh', 'css', 'html', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'env', 'log'].includes(ext || '')

  const startEdit = () => { setEditContent(content || ''); setEditing(true) }
  const saveEdit = async () => {
    await writeFile.mutateAsync({ agentId, filePath, content: editContent })
    setEditing(false)
    refetch()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <File className="w-3.5 h-3.5 text-blue-400/70" />
          <span className="text-white/70 text-xs font-mono">{filePath}</span>
        </div>
        <div className="flex items-center gap-1">
          {isText && !editing && (
            <button onClick={startEdit} className="px-2 py-0.5 text-xs bg-white/5 hover:bg-white/10 rounded text-white/50 transition-colors">Edit</button>
          )}
          {editing && (
            <>
              <button onClick={saveEdit} disabled={writeFile.isPending}
                className="px-2 py-0.5 text-xs bg-desktop-accent/80 hover:bg-desktop-accent rounded text-white flex items-center gap-1 transition-colors">
                {writeFile.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="px-2 py-0.5 text-xs bg-white/5 hover:bg-white/10 rounded text-white/50 transition-colors">Cancel</button>
            </>
          )}
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-3.5 h-3.5 text-white/40" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>}
        {!isLoading && editing && (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full h-full bg-transparent text-white/80 text-xs font-mono p-3 resize-none focus:outline-none"
          />
        )}
        {!isLoading && !editing && isText && (
          <pre className="p-3 text-white/70 text-xs font-mono whitespace-pre-wrap break-words">{content}</pre>
        )}
        {!isLoading && !editing && !isText && (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <File className="w-8 h-8 mb-2" />
            <p className="text-xs">Binary file — cannot preview</p>
            <p className="text-[10px] mt-1">{fileName}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CommandPanel({ agentId }: { agentId: string }) {
  const [command, setCommand] = useState('')
  const [claudeTask, setClaudeTask] = useState('')
  const [tab, setTab] = useState<'exec' | 'claude'>('exec')
  const exec = useExecInWorkspace()
  const runClaude = useRunClaude()
  const [lastResult, setLastResult] = useState<any>(null)

  const handleExec = async () => {
    if (!command.trim()) return
    const result = await exec.mutateAsync({ agentId, command })
    setLastResult({ type: 'exec', command, ...result })
    setCommand('')
  }

  const handleClaude = async () => {
    if (!claudeTask.trim()) return
    const result = await runClaude.mutateAsync({ agentId, task: claudeTask, timeout: 120000 })
    setLastResult({ type: 'claude', task: claudeTask, ...result })
    setClaudeTask('')
  }

  const running = exec.isPending || runClaude.isPending

  return (
    <div className="border-t border-white/10 flex-shrink-0">
      <div className="flex gap-1 p-1.5 border-b border-white/10">
        <button onClick={() => setTab('exec')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${tab === 'exec' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
          <Terminal className="w-3 h-3" /> Shell
        </button>
        <button onClick={() => setTab('claude')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${tab === 'claude' ? 'bg-desktop-accent/20 text-desktop-accent' : 'text-white/40 hover:text-white/60'}`}>
          <Sparkles className="w-3 h-3" /> Claude Code
        </button>
      </div>

      <div className="p-2">
        {tab === 'exec' ? (
          <div className="flex gap-2">
            <input value={command} onChange={e => setCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExec()}
              placeholder="Run shell command in workspace..."
              className="flex-1 px-2 py-1.5 bg-black/20 border border-white/10 rounded text-white placeholder-white/20 text-xs font-mono focus:border-white/30 focus:outline-none"
              disabled={running}
            />
            <button onClick={handleExec} disabled={!command.trim() || running}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded text-white/70 transition-colors">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={claudeTask} onChange={e => setClaudeTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleClaude()}
              placeholder="Describe a task for Claude Code to execute..."
              className="flex-1 px-2 py-1.5 bg-black/20 border border-desktop-accent-border/20 rounded text-white placeholder-white/20 text-xs focus:border-desktop-accent/50 focus:outline-none"
              disabled={running}
            />
            <button onClick={handleClaude} disabled={!claudeTask.trim() || running}
              className="px-2 py-1 bg-desktop-accent/20 hover:bg-desktop-accent/40 disabled:opacity-40 rounded text-desktop-accent transition-colors">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {lastResult && (
        <div className="mx-2 mb-2 p-2 bg-black/30 rounded border border-white/5 max-h-32 overflow-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/30 text-[10px] font-mono">
              {lastResult.type === 'claude' ? `claude: ${lastResult.task}` : `$ ${lastResult.command}`}
            </span>
            <div className="flex items-center gap-1">
              {lastResult.exitCode === 0
                ? <CheckCircle className="w-3 h-3 text-green-400" />
                : <AlertCircle className="w-3 h-3 text-red-400" />}
              <span className="text-white/20 text-[10px]">{lastResult.duration}ms</span>
              <button onClick={() => setLastResult(null)} className="p-0.5 hover:bg-white/10 rounded">
                <X className="w-3 h-3 text-white/30" />
              </button>
            </div>
          </div>
          {lastResult.stdout && <pre className="text-green-400/80 text-[10px] font-mono whitespace-pre-wrap">{lastResult.stdout}</pre>}
          {lastResult.output && <pre className="text-white/70 text-[10px] font-mono whitespace-pre-wrap">{lastResult.output}</pre>}
          {lastResult.stderr && <pre className="text-red-400/70 text-[10px] font-mono whitespace-pre-wrap">{lastResult.stderr}</pre>}
        </div>
      )}
    </div>
  )
}

export function WorkspaceApp() {
  const { data: workspaces = [] } = useWorkspacesList()
  const { data: agents = [] } = useAgents()
  const { data: sandboxInfo } = useSandboxInfo()
  const [selectedAgentId, setSelectedAgentId] = useState<string>('shared')
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [renameTarget, setRenameTarget] = useState<{ path: string; type: string } | null>(null)
  const [renameName, setRenameName] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [showNewFile, setShowNewFile] = useState<'file' | 'folder' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: rootFiles, refetch: refetchFiles } = useWorkspaceFiles(selectedAgentId, '')
  const exec = useExecInWorkspace()
  const writeFile = useWriteWorkspaceFile()
  const deleteFile = useDeleteWorkspaceFile()

  const handleFileSelect = useCallback((path: string, type: string) => {
    if (type === 'file') setSelectedFile(path)
  }, [])

  const handleContextAction = useCallback((action: string, path: string, type: string) => {
    if (action === 'rename') {
      setRenameTarget({ path, type })
      setRenameName(path.split('/').pop() || '')
    } else if (action === 'delete') {
      if (confirm(`Delete ${type === 'directory' ? 'folder' : 'file'} "${path}"?`)) {
        if (type === 'directory') {
          exec.mutate({ agentId: selectedAgentId, command: `rm -rf "${path}"` })
        } else {
          deleteFile.mutate({ agentId: selectedAgentId, filePath: path })
        }
        if (selectedFile === path) setSelectedFile('')
        setTimeout(() => refetchFiles(), 500)
      }
    }
  }, [selectedAgentId, selectedFile])

  const handleRename = async () => {
    if (!renameTarget || !renameName) return
    const dir = renameTarget.path.includes('/') ? renameTarget.path.substring(0, renameTarget.path.lastIndexOf('/')) + '/' : ''
    const newPath = dir + renameName
    await exec.mutateAsync({ agentId: selectedAgentId, command: `mv "${renameTarget.path}" "${newPath}"` })
    setRenameTarget(null)
    if (selectedFile === renameTarget.path) setSelectedFile(newPath)
    refetchFiles()
  }

  const handleNewFile = async () => {
    if (!newFileName) return
    if (showNewFile === 'folder') {
      await exec.mutateAsync({ agentId: selectedAgentId, command: `mkdir -p "${newFileName}"` })
    } else {
      await writeFile.mutateAsync({ agentId: selectedAgentId, filePath: newFileName, content: '' })
    }
    setShowNewFile(null)
    setNewFileName('')
    refetchFiles()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of files) {
      const text = await file.text()
      await writeFile.mutateAsync({ agentId: selectedAgentId, filePath: file.name, content: text })
    }
    refetchFiles()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId)
  const selectedWorkspace = workspaces.find(w => w.agentId === selectedAgentId)

  const allWorkspaces = [
    { agentId: 'shared', agentName: 'Shared' },
    ...workspaces.map((w: any) => {
      const agent = agents.find((a: any) => a.id === w.agentId)
      return { ...w, agentName: agent?.name || w.agentId }
    }),
  ]

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col bg-black/10">
        {/* Sandbox status */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            {sandboxInfo ? (
              <>
                <Cpu className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-[10px] font-medium capitalize">{sandboxInfo.mode} mode</span>
              </>
            ) : (
              <span className="text-white/30 text-[10px]">Loading...</span>
            )}
          </div>
          {sandboxInfo && (
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-desktop-accent/70" />
              <span className="text-white/30 text-[10px] font-mono">claude {sandboxInfo.claudeBin !== 'claude' ? sandboxInfo.claudeBin : 'v2.1.63'}</span>
            </div>
          )}
        </div>

        {/* Workspace list */}
        <div className="p-2 border-b border-white/10 flex-shrink-0">
          <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1.5 px-1">Workspaces</p>
          {allWorkspaces.map(ws => (
            <button
              key={ws.agentId}
              onClick={() => { setSelectedAgentId(ws.agentId); setSelectedFile('') }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors mb-0.5 ${
                selectedAgentId === ws.agentId ? 'bg-desktop-accent/20 text-white' : 'hover:bg-white/5 text-white/60'
              }`}
            >
              {ws.agentId === 'shared' ? (
                <Server className="w-3 h-3 text-purple-400 flex-shrink-0" />
              ) : (
                <Bot className="w-3 h-3 text-blue-400 flex-shrink-0" />
              )}
              <span className="text-xs truncate">{ws.agentName}</span>
            </button>
          ))}
        </div>

        {/* File tree header with actions */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
          <p className="text-white/30 text-[10px] uppercase tracking-wide">Files</p>
          <div className="flex items-center gap-0.5">
            <button onClick={() => { setShowNewFile('file'); setNewFileName('') }} className="p-1 hover:bg-white/10 rounded" title="New File">
              <FilePlus className="w-3 h-3 text-white/30" />
            </button>
            <button onClick={() => { setShowNewFile('folder'); setNewFileName('') }} className="p-1 hover:bg-white/10 rounded" title="New Folder">
              <FolderPlus className="w-3 h-3 text-white/30" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-white/10 rounded" title="Upload">
              <Upload className="w-3 h-3 text-white/30" />
            </button>
            <button onClick={() => refetchFiles()} className="p-1 hover:bg-white/10 rounded" title="Refresh">
              <RefreshCw className="w-3 h-3 text-white/30" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>

        {/* New file/folder inline input */}
        {showNewFile && (
          <div className="px-2 py-1.5 border-b border-white/5 flex items-center gap-1">
            {showNewFile === 'folder' ? <Folder className="w-3 h-3 text-yellow-400/70" /> : <File className="w-3 h-3 text-blue-400/70" />}
            <input value={newFileName} onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNewFile(); if (e.key === 'Escape') setShowNewFile(null) }}
              placeholder={showNewFile === 'folder' ? 'folder-name' : 'filename.ext'}
              className="flex-1 px-1 py-0.5 bg-black/30 border border-white/10 rounded text-xs text-white placeholder-white/30 focus:outline-none"
              autoFocus />
            <button onClick={handleNewFile} className="p-0.5 hover:bg-white/10 rounded"><CheckCircle className="w-3 h-3 text-green-400" /></button>
            <button onClick={() => setShowNewFile(null)} className="p-0.5 hover:bg-white/10 rounded"><X className="w-3 h-3 text-white/40" /></button>
          </div>
        )}

        {/* File tree */}
        <div className="flex-1 overflow-auto py-1">
          {rootFiles?.map((entry: any) => (
            <FileNode
              key={entry.path}
              agentId={selectedAgentId}
              entry={entry}
              depth={0}
              onSelect={handleFileSelect}
              selectedPath={selectedFile}
              onRefresh={refetchFiles}
              onContextAction={handleContextAction}
            />
          ))}
          {rootFiles?.length === 0 && (
            <div className="text-center text-white/20 text-xs py-4">Empty workspace</div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            {selectedAgentId === 'shared' ? (
              <Server className="w-4 h-4 text-purple-400" />
            ) : (
              <Bot className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-white/80 text-sm font-medium">
              {selectedAgentId === 'shared' ? 'Shared Workspace' : (selectedAgent?.name || selectedAgentId)}
            </span>
            {selectedWorkspace && (
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <span>·</span>
                <span>{selectedWorkspace.files ?? 0} files</span>
                <span>·</span>
                <span>{selectedWorkspace.size !== undefined ? formatBytes(selectedWorkspace.size) : '—'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedAgentId !== 'shared' && selectedAgentId !== selectedFile && (
              <span className="text-white/20 text-xs font-mono truncate max-w-[200px]">
                {selectedWorkspace?.path}
              </span>
            )}
          </div>
        </div>

        {/* File viewer or welcome */}
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <FileViewer
              agentId={selectedAgentId}
              filePath={selectedFile}
              onClose={() => setSelectedFile('')}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 p-4">
              <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a file to view</p>
              {selectedAgentId !== 'shared' && (
                <div className="mt-3 text-center text-xs space-y-1">
                  <p className="text-white/30">Agents can read all workspaces.</p>
                  <p className="text-white/20">Only this agent can write here.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Command runner */}
        {selectedAgentId && selectedAgentId !== 'shared' && (
          <CommandPanel agentId={selectedAgentId} />
        )}
      </div>

      {/* Rename modal */}
      {renameTarget && (
        <div className="overlay" onClick={() => setRenameTarget(null)}>
          <div className="modal w-[360px] p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-ink-1 font-semibold text-sm mb-3">Rename</h3>
            <p className="text-ink-3 text-xs mb-2">Current: <span className="font-mono">{renameTarget.path}</span></p>
            <input value={renameName} onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename() }}
              className="app-input mb-4" autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenameTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleRename} disabled={exec.isPending} className="btn-primary">
                {exec.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
