import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Bot, ListTodo, FileText, Puzzle, X, Command, FolderOpen } from 'lucide-react'
import { useWindowStore } from '../stores/windowStore'
import { useAgents } from '../hooks/useAgents'
import { useTasks } from '../hooks/useTasks'
import { usePrompts } from '../hooks/usePrompts'
import { useSkills } from '../hooks/useSkills'

interface SearchResult { id: string; type: string; label: string; sublabel?: string; action: () => void }

const APP_MAP: Record<string, { component: string; icon: string }> = {
  'Agent Team': { component: 'AgentTeam', icon: 'Users' },
  'Tasks':      { component: 'Tasks',     icon: 'ListTodo' },
  'Chat':       { component: 'Chat',      icon: 'MessageSquare' },
  'Workspace':  { component: 'Workspace', icon: 'FolderOpen' },
  'Skills':     { component: 'Skills',    icon: 'Puzzle' },
  'Prompts':    { component: 'Prompts',   icon: 'FileText' },
  'Canvas':     { component: 'Canvas',    icon: 'Workflow' },
  'Terminal':   { component: 'Terminal',  icon: 'Terminal' },
  'Settings':   { component: 'Settings',  icon: 'Settings' },
}

const APP_ENTRIES = Object.entries(APP_MAP).map(([title, { component, icon }]) => ({
  id: `app-${component.toLowerCase()}`, type: 'app', label: title, sublabel: 'App',
  component, icon,
}))

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  agent: Bot, task: ListTodo, prompt: FileText, skill: Puzzle, app: Command, workspace: FolderOpen,
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { openWindow } = useWindowStore()
  const { data: agents = [] } = useAgents()
  const { data: tasks = [] } = useTasks()
  const { data: prompts = [] } = usePrompts()
  const { data: _skills = [] } = useSkills()

  const buildResults = useCallback((): SearchResult[] => {
    const q = query.toLowerCase()
    const makeAppAction = (entry: typeof APP_ENTRIES[0]) => () => {
      openWindow({ id: entry.id.replace('app-', ''), title: entry.label, icon: entry.icon, component: entry.component })
      setOpen(false)
    }

    if (!q) return APP_ENTRIES.map(e => ({ id: e.id, type: 'app', label: e.label, sublabel: e.sublabel, action: makeAppAction(e) }))

    const results: SearchResult[] = []
    APP_ENTRIES.forEach(e => {
      if (e.label.toLowerCase().includes(q)) results.push({ id: e.id, type: 'app', label: e.label, sublabel: 'App', action: makeAppAction(e) })
    })
    agents.filter((a: any) => a.name?.toLowerCase().includes(q)).slice(0, 3).forEach((a: any) =>
      results.push({ id: `agent-${a.id}`, type: 'agent', label: a.name, sublabel: `Agent · ${a.role}`,
        action: () => { openWindow({ id: 'agent-team', title: 'Agent Team', icon: 'Users', component: 'AgentTeam' }); setOpen(false) } }))
    tasks.filter((t: any) => t.name?.toLowerCase().includes(q)).slice(0, 3).forEach((t: any) =>
      results.push({ id: `task-${t.id}`, type: 'task', label: t.name, sublabel: `Task · ${t.status}`,
        action: () => { openWindow({ id: 'tasks', title: 'Tasks', icon: 'ListTodo', component: 'Tasks' }); setOpen(false) } }))
    prompts.filter((p: any) => p.name?.toLowerCase().includes(q)).slice(0, 3).forEach((p: any) =>
      results.push({ id: `prompt-${p.id}`, type: 'prompt', label: p.name, sublabel: `Prompt`,
        action: () => { openWindow({ id: 'prompts', title: 'Prompts', icon: 'FileText', component: 'Prompts' }); setOpen(false) } }))
    return results
  }, [query, agents, tasks, prompts, openWindow])

  const results = buildResults()
  useEffect(() => setSelected(0), [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(p => !p); setQuery('') }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) results[selected].action()
  }

  if (!open) return null

  return (
    <div className="overlay" onClick={() => setOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
      <div className="w-[540px] rounded-2xl overflow-hidden" style={{ background: 'rgba(22,22,26,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 48px 96px -16px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search className="w-4 h-4 text-ink-4 flex-shrink-0" strokeWidth={1.75} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="搜索 Apps、Agents、Tasks、Prompts…"
            className="flex-1 bg-transparent text-ink-1 placeholder-ink-4 focus:outline-none text-sm" />
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/5 rounded transition-colors">
            <X className="w-3.5 h-3.5 text-ink-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-auto py-1">
          {results.length === 0 && <div className="text-center text-ink-4 text-sm py-10">No results</div>}
          {results.map((result, i) => {
            const Icon = TYPE_ICONS[result.type] || Command
            return (
              <button key={result.id} onClick={result.action} onMouseEnter={() => setSelected(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: selected === i ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Icon className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ink-1 text-sm">{result.label}</p>
                  {result.sublabel && <p className="text-ink-4 text-xs">{result.sublabel}</p>}
                </div>
                {selected === i && <span className="text-ink-4 text-xs">↵</span>}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 text-ink-disabled text-[11px]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {[['↑↓', '导航'], ['↵', '打开'], ['Esc', '关闭']].map(([key, action]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.06)' }}>{key}</kbd>
              {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
