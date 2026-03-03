import { useState } from 'react'
import { Plus, Bot, Settings, Trash2, X, Save, AlertCircle, Loader2 } from 'lucide-react'
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from '../../hooks/useAgents'

const ROLES = ['developer', 'designer', 'researcher', 'custom'] as const
const MODELS = ['claude-sonnet-4-5', 'claude-haiku-3-5', 'claude-opus-4-5']

const ROLE_COLORS: Record<string, string> = {
  developer: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  designer:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  researcher:'text-amber-400 bg-amber-500/10 border-amber-500/20',
  custom:    'text-ink-3 bg-white/5 border-white/10',
}

interface AgentFormData {
  name: string; role: string; systemPrompt: string
  config: { model: string; temperature: number; maxTokens: number }
}

const defaultForm: AgentFormData = {
  name: '', role: 'developer', systemPrompt: '',
  config: { model: 'claude-sonnet-4-5', temperature: 0.7, maxTokens: 4096 },
}

function StatusDot({ status }: { status: string }) {
  const cls = status === 'running' ? 'bg-state-success' : status === 'error' ? 'bg-state-error' : 'bg-white/20'
  return <span className={`w-1.5 h-1.5 rounded-full ${cls} flex-shrink-0`} />
}

interface AgentModalProps { initial?: any; onClose: () => void; onSave: (d: AgentFormData) => void; saving: boolean }

function AgentModal({ initial, onClose, onSave, saving }: AgentModalProps) {
  const [form, setForm] = useState<AgentFormData>(
    initial ? {
      name: initial.name, role: initial.role, systemPrompt: initial.systemPrompt || '',
      config: { model: initial.config?.model || 'claude-sonnet-4-5', temperature: initial.config?.temperature ?? 0.7, maxTokens: initial.config?.maxTokens ?? 4096 }
    } : defaultForm
  )
  const set = (key: keyof AgentFormData, val: any) => setForm(f => ({ ...f, [key]: val }))
  const setConfig = (key: string, val: any) => setForm(f => ({ ...f, config: { ...f.config, [key]: val } }))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-ink-1 font-semibold text-sm">{initial ? 'Edit Agent' : 'New Agent'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-ink-3" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Code Reviewer" className="app-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="app-input appearance-none">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Model</label>
              <select value={form.config.model} onChange={e => setConfig('model', e.target.value)}
                className="app-input appearance-none">
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">System Prompt</label>
            <textarea value={form.systemPrompt} onChange={e => set('systemPrompt', e.target.value)}
              placeholder="Describe the agent's persona and capabilities..." rows={3}
              className="app-input resize-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-ink-3 text-xs">Temperature</label>
              <span className="text-ink-3 text-xs font-mono">{form.config.temperature}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={form.config.temperature}
              onChange={e => setConfig('temperature', parseFloat(e.target.value))}
              className="w-full accent-desktop-accent" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim() || saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AgentTeamApp() {
  const { data: agents = [], isLoading, error } = useAgents()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)

  const handleSave = async (form: AgentFormData) => {
    if (editTarget) await updateAgent.mutateAsync({ id: editTarget.id, ...form })
    else await createAgent.mutateAsync(form)
    setShowModal(false); setEditTarget(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="app-header">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Agent Team</h2>
          <p className="text-ink-3 text-xs mt-0.5">{agents.length} agent{agents.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowModal(true) }} className="btn-primary">
          <Plus className="w-3.5 h-3.5" /> New Agent
        </button>
      </div>

      {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-ink-4 animate-spin" /></div>}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-state-error text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> Failed to load agents. Make sure the API server is running.
        </div>
      )}

      {!isLoading && !error && agents.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-ink-4">
          <Bot className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">No agents yet</p>
          <p className="text-xs mt-0.5 text-ink-disabled">Click "New Agent" to get started</p>
        </div>
      )}

      {!isLoading && agents.length > 0 && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent: any) => (
              <div key={agent.id} className="app-card group flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,76,106,0.12)' }}>
                    <Bot className="w-4 h-4 text-desktop-accent" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ink-1 text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-ink-3 text-xs capitalize">{agent.role}</p>
                  </div>
                </div>

                {agent.systemPrompt && (
                  <p className="text-ink-4 text-xs line-clamp-2 leading-relaxed">{agent.systemPrompt}</p>
                )}

                {agent.config?.model && (
                  <p className="text-ink-4 text-[11px] font-mono truncate">{agent.config.model}</p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={agent.status || 'idle'} />
                    <span className="text-ink-3 text-xs capitalize">{agent.status || 'idle'}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditTarget(agent); setShowModal(true) }} className="p-1 hover:bg-white/5 rounded transition-colors">
                      <Settings className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this agent?')) deleteAgent.mutate(agent.id) }} className="p-1 hover:bg-state-error/10 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-state-error/70" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AgentModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSave={handleSave}
          saving={createAgent.isPending || updateAgent.isPending}
        />
      )}
    </div>
  )
}
