import { useState } from 'react'
import {
  Plus, Radio, Trash2, X, Save, Loader2, Plug, PlugZap,
  Clock, Bot,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { channelsApi, scheduledTasksApi } from '../../lib/api'
import { useAgents } from '../../hooks/useAgents'
import { useTeams } from '../../hooks/useTeams'
import { useToastStore } from '../../stores/toastStore'

const CHANNEL_TYPES = [
  { value: 'telegram', label: 'Telegram', color: '#60A5FA' },
  { value: 'feishu', label: '飞书', color: '#22D3EE' },
]

function CreateChannelModal({ agents, teams, onClose, onSave, saving }: any) {
  const [form, setForm] = useState({ type: 'telegram', name: '', config: {} as any, agentId: '', teamId: '' })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-ink-1 font-semibold text-sm">New Channel</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg"><X className="w-4 h-4 text-ink-3" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, config: {} }))} className="app-input appearance-none">
                {CHANNEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Bot" className="app-input" />
            </div>
          </div>

          {form.type === 'telegram' && (
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Bot Token</label>
              <input value={form.config.botToken || ''} onChange={e => setForm(f => ({ ...f, config: { ...f.config, botToken: e.target.value } }))} placeholder="123456:ABC-DEF..." className="app-input font-mono" />
              <p className="text-ink-4 text-[10px] mt-1">从 @BotFather 获取</p>
            </div>
          )}

          {form.type === 'feishu' && (
            <>
              <div>
                <label className="text-ink-3 text-xs mb-1.5 block">App ID</label>
                <input value={form.config.appId || ''} onChange={e => setForm(f => ({ ...f, config: { ...f.config, appId: e.target.value } }))} className="app-input font-mono" />
              </div>
              <div>
                <label className="text-ink-3 text-xs mb-1.5 block">App Secret</label>
                <input type="password" value={form.config.appSecret || ''} onChange={e => setForm(f => ({ ...f, config: { ...f.config, appSecret: e.target.value } }))} className="app-input font-mono" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Bind Agent</label>
              <select value={form.agentId} onChange={e => setForm(f => ({ ...f, agentId: e.target.value, teamId: '' }))} className="app-input appearance-none" disabled={!!form.teamId}>
                <option value="">None</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Or Bind Team</label>
              <select value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value, agentId: '' }))} className="app-input appearance-none" disabled={!!form.agentId}>
                <option value="">None</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSave({ ...form, agentId: form.agentId || undefined, teamId: form.teamId || undefined })} disabled={!form.name.trim() || saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Creating…' : 'Create Channel'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateScheduledTaskModal({ agents, channels, onClose, onSave, saving }: any) {
  const [form, setForm] = useState({
    name: '', description: '', prompt: '', agentId: '', teamId: '',
    channelId: '', chatId: '', scheduleType: 'cron' as string, scheduleValue: '',
  })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[540px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-ink-1 font-semibold text-sm">New Scheduled Task</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg"><X className="w-4 h-4 text-ink-3" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Task Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Daily Report" className="app-input" />
          </div>
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Prompt</label>
            <textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} placeholder="What should the agent do..." rows={3} className="app-input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Schedule Type</label>
              <select value={form.scheduleType} onChange={e => setForm(f => ({ ...f, scheduleType: e.target.value }))} className="app-input appearance-none">
                <option value="cron">Cron</option>
                <option value="interval">Interval (seconds)</option>
                <option value="once">Once</option>
              </select>
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">
                {form.scheduleType === 'cron' ? 'Cron Expression' : form.scheduleType === 'interval' ? 'Seconds' : 'Date/Time (ISO)'}
              </label>
              <input value={form.scheduleValue} onChange={e => setForm(f => ({ ...f, scheduleValue: e.target.value }))} placeholder={form.scheduleType === 'cron' ? '0 9 * * 1-5' : form.scheduleType === 'interval' ? '3600' : '2026-03-05T09:00:00Z'} className="app-input font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Agent</label>
              <select value={form.agentId} onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))} className="app-input appearance-none">
                <option value="">Default</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Send result to channel</label>
              <select value={form.channelId} onChange={e => setForm(f => ({ ...f, channelId: e.target.value }))} className="app-input appearance-none">
                <option value="">None</option>
                {channels.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
          </div>
          {form.channelId && (
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Chat ID</label>
              <input value={form.chatId} onChange={e => setForm(f => ({ ...f, chatId: e.target.value }))} placeholder="tg:123456 or feishu:oc_xxx" className="app-input font-mono" />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSave({ ...form, agentId: form.agentId || undefined, teamId: form.teamId || undefined, channelId: form.channelId || undefined, chatId: form.chatId || undefined })} disabled={!form.name.trim() || !form.prompt.trim() || !form.scheduleValue.trim() || saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            {saving ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ChannelsApp() {
  const [tab, setTab] = useState<'channels' | 'scheduled'>('channels')
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const toast = useToastStore(s => s.show)
  const qc = useQueryClient()

  const { data: agents = [] } = useAgents()
  const { data: teams = [] } = useTeams()
  const { data: channels = [], isLoading } = useQuery({ queryKey: ['channels'], queryFn: channelsApi.list, refetchInterval: 5000 })
  const { data: scheduledTasks = [] } = useQuery({ queryKey: ['scheduled-tasks'], queryFn: scheduledTasksApi.list, refetchInterval: 5000 })

  const createChannel = useMutation({ mutationFn: channelsApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); toast('success', 'Channel created') } })
  const deleteChannel = useMutation({ mutationFn: channelsApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); toast('info', 'Channel deleted') } })
  const connectChannel = useMutation({ mutationFn: channelsApi.connect, onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); toast('success', 'Channel connected') }, onError: (e: any) => toast('error', e.message) })
  const disconnectChannel = useMutation({ mutationFn: channelsApi.disconnect, onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }) } })

  const createTask = useMutation({ mutationFn: scheduledTasksApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduled-tasks'] }); toast('success', 'Scheduled task created') } })
  const pauseTask = useMutation({ mutationFn: scheduledTasksApi.pause, onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-tasks'] }) })
  const resumeTask = useMutation({ mutationFn: scheduledTasksApi.resume, onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-tasks'] }) })
  const deleteTask = useMutation({ mutationFn: scheduledTasksApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ['scheduled-tasks'] }); toast('info', 'Task deleted') } })

  return (
    <div className="h-full flex flex-col">
      <div className="app-header">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Channels & Scheduler</h2>
          <p className="text-ink-3 text-xs mt-0.5">{(channels as any[]).length} channels · {(scheduledTasks as any[]).length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setTab('channels')} className={`px-2.5 py-1 rounded text-xs transition-colors ${tab === 'channels' ? 'text-desktop-accent bg-desktop-accent/10' : 'text-ink-3'}`}>Channels</button>
            <button onClick={() => setTab('scheduled')} className={`px-2.5 py-1 rounded text-xs transition-colors ${tab === 'scheduled' ? 'text-desktop-accent bg-desktop-accent/10' : 'text-ink-3'}`}>Scheduled</button>
          </div>
          {tab === 'channels' ? (
            <button onClick={() => setShowChannelModal(true)} className="btn-primary"><Plus className="w-3.5 h-3.5" /> New Channel</button>
          ) : (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary"><Plus className="w-3.5 h-3.5" /> New Task</button>
          )}
        </div>
      </div>

      {tab === 'channels' && (
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 text-ink-4 animate-spin" /></div>
          ) : (channels as any[]).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-ink-4">
              <Radio className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm text-ink-3">No channels configured</p>
              <p className="text-xs mt-0.5 text-ink-disabled">Connect Telegram or Feishu to receive messages</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(channels as any[]).map((ch: any) => {
                const isConnected = ch.status === 'connected'
                const agent = (agents as any[]).find(a => a.id === ch.agentId)
                return (
                  <div key={ch.id} className="app-card group flex flex-col gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ch.type === 'telegram' ? 'rgba(96,165,250,0.12)' : 'rgba(34,211,238,0.12)' }}>
                        <Radio className="w-4 h-4" style={{ color: ch.type === 'telegram' ? '#60A5FA' : '#22D3EE' }} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ink-1 text-sm font-medium truncate">{ch.name}</p>
                        <p className="text-ink-3 text-xs capitalize">{ch.type}</p>
                      </div>
                    </div>
                    {agent && <p className="text-ink-4 text-[11px]">Bound to: {agent.name}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-ink-3 text-xs">{ch.status}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isConnected ? (
                          <button onClick={() => disconnectChannel.mutate(ch.id)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-state-error hover:bg-state-error/10">
                            <PlugZap className="w-3 h-3" /> Disconnect
                          </button>
                        ) : (
                          <button onClick={() => connectChannel.mutate(ch.id)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-state-success hover:bg-state-success/10">
                            <Plug className="w-3 h-3" /> Connect
                          </button>
                        )}
                        <button onClick={() => deleteChannel.mutate(ch.id)} className="p-1 hover:bg-state-error/10 rounded">
                          <Trash2 className="w-3 h-3 text-state-error/70" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'scheduled' && (
        <div className="flex-1 overflow-auto">
          {(scheduledTasks as any[]).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-ink-4">
              <Clock className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm text-ink-3">No scheduled tasks</p>
              <p className="text-xs mt-0.5 text-ink-disabled">Create recurring tasks for your agents</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(scheduledTasks as any[]).map((task: any) => {
                const agent = (agents as any[]).find(a => a.id === task.agentId)
                const isPaused = task.status === 'paused'
                return (
                  <div key={task.id} className="app-card group flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-ink-1 text-xs font-medium">{task.name}</p>
                        <p className="text-ink-4 text-[11px] font-mono">{task.scheduleType}: {task.scheduleValue}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPaused ? (
                          <button onClick={() => resumeTask.mutate(task.id)} className="px-2 py-0.5 rounded text-[11px] text-state-success hover:bg-state-success/10">Resume</button>
                        ) : (
                          <button onClick={() => pauseTask.mutate(task.id)} className="px-2 py-0.5 rounded text-[11px] text-state-warning hover:bg-state-warning/10">Pause</button>
                        )}
                        <button onClick={() => deleteTask.mutate(task.id)} className="p-1 hover:bg-state-error/10 rounded">
                          <Trash2 className="w-3 h-3 text-state-error/70" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-[10px] ${isPaused ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' : task.status === 'completed' ? 'text-green-300 bg-green-500/10 border-green-500/20' : 'text-blue-300 bg-blue-500/10 border-blue-500/20'}`}>{task.status}</span>
                      {agent && <span className="text-[10px] text-ink-4"><Bot className="w-2.5 h-2.5 inline" /> {agent.name}</span>}
                      {task.nextRun && <span className="text-[10px] text-ink-4">Next: {new Date(task.nextRun).toLocaleString('zh-CN')}</span>}
                    </div>
                    {task.lastResult && (
                      <p className="text-[10px] text-ink-4 line-clamp-2 leading-relaxed">{task.lastResult.slice(0, 150)}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showChannelModal && (
        <CreateChannelModal
          agents={agents} teams={teams}
          saving={createChannel.isPending}
          onClose={() => setShowChannelModal(false)}
          onSave={async (d: any) => { await createChannel.mutateAsync(d); setShowChannelModal(false) }}
        />
      )}

      {showTaskModal && (
        <CreateScheduledTaskModal
          agents={agents} channels={channels}
          saving={createTask.isPending}
          onClose={() => setShowTaskModal(false)}
          onSave={async (d: any) => { await createTask.mutateAsync(d); setShowTaskModal(false) }}
        />
      )}
    </div>
  )
}
