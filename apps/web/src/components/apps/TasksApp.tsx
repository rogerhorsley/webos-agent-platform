import { useState, useEffect } from 'react'
import { Plus, X, Play, StopCircle, Trash2, AlertCircle, Loader2, Clock, CheckCircle2, CircleDot, Circle, Users } from 'lucide-react'
import { useTasks, useCreateTask, useStartTask, useCancelTask, useDeleteTask } from '../../hooks/useTasks'
import { useAgents } from '../../hooks/useAgents'
import { getSocket } from '../../lib/socket'
import { useTeams } from '../../hooks/useTeams'

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'text-state-error bg-state-error/10 border-state-error/25',
  high:   'text-orange-400 bg-orange-500/10 border-orange-500/25',
  medium: 'text-state-info bg-state-info/10 border-state-info/25',
  low:    'text-ink-3 bg-white/5 border-white/10',
}

const COLUMNS = [
  { key: 'pending',   label: 'Pending',  Icon: Circle,       color: 'text-ink-3' },
  { key: 'running',   label: 'Running',  Icon: CircleDot,    color: 'text-state-info' },
  { key: 'completed', label: 'Done',     Icon: CheckCircle2, color: 'text-state-success' },
]

function TaskCard({ task, onStart, onCancel, onDelete, onOpenTeamRun }: any) {
  const [progress, setProgress] = useState(task.progress?.current ?? 0)
  useEffect(() => {
    const socket = getSocket()
    socket.emit('task:subscribe', { taskId: task.id })
    const handler = (data: any) => { if (data.taskId === task.id && data.progress !== undefined) setProgress(data.progress) }
    socket.on('task:progress', handler)
    return () => { socket.off('task:progress', handler) }
  }, [task.id])

  return (
    <div className="app-card group flex flex-col gap-2">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-ink-1 text-xs font-medium leading-snug">{task.name}</p>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-state-error/10 rounded transition-all flex-shrink-0">
          <Trash2 className="w-3 h-3 text-state-error/70" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`badge ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}>{task.priority}</span>
        <span className="badge text-ink-4 bg-white/5 border-white/10">{task.type}</span>
        {task.teamId ? (
          <button
            onClick={() => onOpenTeamRun?.(task)}
            className="badge text-purple-300 bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/15"
          >
            <Users className="w-3 h-3" /> Team
          </button>
        ) : null}
      </div>

      {task.status === 'running' && (
        <div>
          <div className="flex justify-between text-[11px] text-ink-3 mb-1">
            <span>Progress</span><span className="font-mono">{progress}%</span>
          </div>
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full bg-desktop-accent transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-ink-4 text-[11px]">
          <Clock className="w-3 h-3" />
          {new Date(task.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </span>
        {task.status === 'pending' && (
          <button onClick={() => onStart(task.id)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-state-info transition-colors hover:bg-state-info/10">
            <Play className="w-2.5 h-2.5" /> Start
          </button>
        )}
        {task.status === 'running' && (
          <button onClick={() => onCancel(task.id)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-state-error transition-colors hover:bg-state-error/10">
            <StopCircle className="w-2.5 h-2.5" /> Cancel
          </button>
        )}
      </div>
    </div>
  )
}

function CreateTaskModal({ agents, teams, onClose, onSave, saving }: any) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'chat',
    priority: 'medium',
    agentId: '',
    teamId: '',
    input: { prompt: '' },
  })
  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-ink-1 font-semibold text-sm">New Task</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg"><X className="w-4 h-4 text-ink-3" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Task Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="What needs to be done?" className="app-input" />
          </div>
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Instructions</label>
            <textarea value={form.input.prompt} onChange={e => setForm(f => ({ ...f, input: { prompt: e.target.value } }))} placeholder="Describe what the agent should do…" rows={3} className="app-input resize-none" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[['Type','type',['chat','workflow','batch']],['Priority','priority',['low','medium','high','urgent']]].map(([label, key, opts]) => (
              <div key={String(key)}>
                <label className="text-ink-3 text-xs mb-1.5 block">{String(label)}</label>
                <select value={(form as any)[key as string]} onChange={e => set(key as string, e.target.value)} className="app-input appearance-none w-full">
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Agent</label>
              <select
                value={form.agentId}
                onChange={e => setForm(f => ({ ...f, agentId: e.target.value, teamId: e.target.value ? '' : f.teamId }))}
                className="app-input appearance-none w-full"
                disabled={!!form.teamId}
              >
                <option value="">None</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Team</label>
              <select
                value={form.teamId}
                onChange={e => setForm(f => ({ ...f, teamId: e.target.value, agentId: e.target.value ? '' : f.agentId }))}
                className="app-input appearance-none w-full"
                disabled={!!form.agentId}
              >
                <option value="">None</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => onSave({
              ...form,
              agentId: form.agentId || undefined,
              teamId: form.teamId || undefined,
            })}
            disabled={!form.name.trim() || !form.input.prompt.trim() || saving}
            className="btn-primary flex-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamRunPanel({ taskId, teamId, onClose }: { taskId: string; teamId: string; onClose: () => void }) {
  const [progress, setProgress] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [done, setDone] = useState<any>(null)

  useEffect(() => {
    const socket = getSocket()
    socket.emit('team:subscribe', { taskId })

    const onProgress = (data: any) => {
      if (data.taskId !== taskId) return
      setProgress(data)
    }
    const onStep = (data: any) => {
      if (data.taskId !== taskId) return
      setSteps(prev => [data, ...prev].slice(0, 30))
    }
    const onDone = (data: any) => {
      if (data.taskId !== taskId) return
      setDone(data)
    }

    socket.on('team:progress', onProgress)
    socket.on('team:step', onStep)
    socket.on('team:done', onDone)
    return () => {
      socket.off('team:progress', onProgress)
      socket.off('team:step', onStep)
      socket.off('team:done', onDone)
    }
  }, [taskId])

  return (
    <div className="app-card h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-ink-2 text-xs font-semibold">Team Run</h3>
          <p className="text-[11px] text-ink-4 font-mono">task: {taskId.slice(0, 8)} · team: {teamId.slice(0, 8)}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded"><X className="w-3.5 h-3.5 text-ink-4" /></button>
      </div>

      {progress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-ink-3">
            <span>{progress.mode || 'team'} · {progress.status}</span>
            <span>{progress.step || 0}/{progress.totalSteps || 0}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full bg-desktop-accent transition-all" style={{ width: `${Math.round(((progress.step || 0) / Math.max(progress.totalSteps || 1, 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto space-y-2">
        {steps.map((s, idx) => (
          <div key={`${s.agentId}-${s.step}-${idx}`} className="px-2.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-2">{s.agentName}</span>
              <span className="text-[10px] text-ink-4">{s.status}</span>
            </div>
            <div className="text-[10px] text-ink-4">step {s.step}/{s.totalSteps}</div>
          </div>
        ))}
      </div>

      {done?.summary && (
        <div className="text-[11px] text-ink-3 p-2 rounded" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
          {done.summary}
        </div>
      )}
    </div>
  )
}

export function TasksApp() {
  const { data: tasks = [], isLoading, error } = useTasks()
  const { data: agents = [] } = useAgents()
  const { data: teams = [] } = useTeams()
  const createTask = useCreateTask()
  const startTask = useStartTask()
  const cancelTask = useCancelTask()
  const deleteTask = useDeleteTask()
  const [showModal, setShowModal] = useState(false)
  const [teamRunTask, setTeamRunTask] = useState<any | null>(null)

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter((t: any) => col.key === 'completed' ? ['completed','failed','cancelled'].includes(t.status) : t.status === col.key)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="h-full flex flex-col">
      <div className="app-header">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Tasks</h2>
          <p className="text-ink-3 text-xs mt-0.5">{tasks.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-3.5 h-3.5" /> New Task</button>
      </div>

      {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-ink-4 animate-spin" /></div>}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-state-error text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <AlertCircle className="w-4 h-4" /> Failed to load tasks.
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 overflow-hidden grid grid-cols-4 gap-3 min-h-0">
          {COLUMNS.map(({ key, label, Icon, color }) => {
            const items = grouped[key] || []
            return (
              <div key={key} className="flex flex-col min-h-0">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.75} />
                  <span className="text-ink-2 text-xs font-medium">{label}</span>
                  <span className="ml-auto text-ink-4 text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>{items.length}</span>
                </div>
                <div className="flex-1 overflow-auto space-y-2">
                  {items.map((task: any) => (
                    <TaskCard key={task.id} task={task}
                      onStart={(id: string) => startTask.mutate(id)}
                      onCancel={(id: string) => cancelTask.mutate(id)}
                      onDelete={(id: string) => deleteTask.mutate(id)}
                      onOpenTeamRun={(t: any) => setTeamRunTask(t)}
                    />
                  ))}
                  {items.length === 0 && <div className="text-center text-ink-disabled text-xs py-5">Empty</div>}
                </div>
              </div>
            )
          })}
          <div className="min-h-0">
            {teamRunTask?.teamId ? (
              <TeamRunPanel
                taskId={teamRunTask.id}
                teamId={teamRunTask.teamId}
                onClose={() => setTeamRunTask(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-ink-4 text-xs border border-white/10 rounded-xl">
                选择 Team 任务查看协作时间线
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <CreateTaskModal agents={agents} teams={teams} onClose={() => setShowModal(false)}
          onSave={async (d: any) => { await createTask.mutateAsync(d); setShowModal(false) }}
          saving={createTask.isPending}
        />
      )}
    </div>
  )
}
