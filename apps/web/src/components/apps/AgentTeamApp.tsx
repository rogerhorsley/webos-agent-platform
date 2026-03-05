import { useMemo, useState } from 'react'
import {
  Plus, Bot, Settings, Trash2, X, Save, AlertCircle, Loader2, Users,
  Download, Search, Store,
} from 'lucide-react'
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from '../../hooks/useAgents'
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from '../../hooks/useTeams'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsApi } from '../../lib/api'
import { useToastStore } from '../../stores/toastStore'

const ROLES = ['developer', 'designer', 'researcher', 'coordinator', 'custom'] as const
const MODELS = ['claude-sonnet-4-5', 'claude-haiku-3-5', 'claude-opus-4-5']
const TEAM_MODES = ['sequential', 'parallel', 'hierarchical'] as const

const TEAM_MODE_STYLES: Record<string, string> = {
  sequential: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  parallel: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
  hierarchical: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
}

interface AgentFormData {
  name: string; role: string; systemPrompt: string
  config: { model: string; temperature: number; maxTokens: number }
}

interface TeamFormData {
  name: string
  description: string
  agentIds: string[]
  coordinatorId?: string
  communicationMode: 'sequential' | 'parallel' | 'hierarchical'
  sharedContext: boolean
}

const defaultForm: AgentFormData = {
  name: '', role: 'developer', systemPrompt: '',
  config: { model: 'claude-sonnet-4-5', temperature: 0.7, maxTokens: 4096 },
}

const defaultTeamForm: TeamFormData = {
  name: '',
  description: '',
  agentIds: [],
  coordinatorId: undefined,
  communicationMode: 'sequential',
  sharedContext: true,
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

interface TeamModalProps {
  agents: any[]
  initial?: any
  saving: boolean
  onClose: () => void
  onSave: (data: TeamFormData) => void
}

function TeamModal({ agents, initial, saving, onClose, onSave }: TeamModalProps) {
  const [form, setForm] = useState<TeamFormData>(
    initial ? {
      name: initial.name || '',
      description: initial.description || '',
      agentIds: initial.agentIds || initial.agents?.map((a: any) => a.id) || [],
      coordinatorId: initial.coordinatorId || '',
      communicationMode: initial.communicationMode || 'sequential',
      sharedContext: initial.sharedContext ?? true,
    } : defaultTeamForm
  )

  const toggleAgent = (id: string) => {
    setForm(prev => ({
      ...prev,
      agentIds: prev.agentIds.includes(id)
        ? prev.agentIds.filter(x => x !== id)
        : [...prev.agentIds, id],
      coordinatorId: prev.coordinatorId === id && prev.agentIds.includes(id)
        ? undefined
        : prev.coordinatorId,
    }))
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[620px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-ink-1 font-semibold text-sm">{initial ? 'Edit Team' : 'New Team'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-ink-3" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Team Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Growth Squad"
                className="app-input"
              />
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Communication Mode</label>
              <select
                value={form.communicationMode}
                onChange={e => setForm(f => ({ ...f, communicationMode: e.target.value as TeamFormData['communicationMode'] }))}
                className="app-input appearance-none"
              >
                {TEAM_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="app-input resize-none"
              placeholder="What this team is responsible for..."
            />
          </div>

          <div className="app-card">
            <div className="flex items-center justify-between mb-2">
              <label className="text-ink-2 text-xs font-medium">Members</label>
              <span className="text-ink-4 text-[11px]">{form.agentIds.length} selected</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto">
              {agents.map((agent: any) => {
                const selected = form.agentIds.includes(agent.id)
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`text-left px-2.5 py-2 rounded-lg border transition-colors ${
                      selected ? 'border-desktop-accent bg-desktop-accent/10' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs text-ink-2 font-medium truncate">{agent.name}</div>
                    <div className="text-[11px] text-ink-4 capitalize">{agent.role}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1.5 block">Coordinator</label>
              <select
                value={form.coordinatorId || ''}
                onChange={e => setForm(f => ({ ...f, coordinatorId: e.target.value || undefined }))}
                className="app-input appearance-none"
              >
                <option value="">Auto (first member)</option>
                {agents
                  .filter((a: any) => form.agentIds.includes(a.id))
                  .map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-ink-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sharedContext}
                  onChange={e => setForm(f => ({ ...f, sharedContext: e.target.checked }))}
                  className="accent-desktop-accent"
                />
                Shared Context
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || form.agentIds.length === 0 || saving}
            className="btn-primary flex-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AgentTeamApp() {
  const { data: agents = [], isLoading, error } = useAgents()
  const { data: teams = [], isLoading: teamsLoading } = useTeams()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()

  const [tab, setTab] = useState<'agents' | 'market' | 'teams'>('agents')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editTeamTarget, setEditTeamTarget] = useState<any>(null)
  const [marketSearch, setMarketSearch] = useState('')

  const toast = useToastStore(s => s.show)
  const qc = useQueryClient()
  const { data: templates = [] } = useQuery({ queryKey: ['agent-templates'], queryFn: agentsApi.listTemplates })
  const installTemplate = useMutation({
    mutationFn: agentsApi.installTemplate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); qc.invalidateQueries({ queryKey: ['agent-templates'] }); toast('success', 'Agent installed from template') },
    onError: (err: any) => toast('error', err.message || 'Install failed'),
  })

  const filteredTemplates = (templates as any[]).filter((t: any) =>
    !marketSearch || t.name.toLowerCase().includes(marketSearch.toLowerCase()) || t.description?.toLowerCase().includes(marketSearch.toLowerCase())
  )

  const handleSave = async (form: AgentFormData) => {
    try {
      if (editTarget) await updateAgent.mutateAsync({ id: editTarget.id, ...form })
      else await createAgent.mutateAsync(form)
      setShowModal(false); setEditTarget(null)
      toast('success', editTarget ? 'Agent updated' : 'Agent created')
    } catch (err: any) {
      toast('error', err.message || 'Failed to save agent')
    }
  }

  const handleSaveTeam = async (form: TeamFormData) => {
    try {
      const payload = {
        ...form,
        description: form.description || undefined,
        coordinatorId: form.coordinatorId || undefined,
      }
      if (editTeamTarget) await updateTeam.mutateAsync({ id: editTeamTarget.id, ...payload })
      else await createTeam.mutateAsync(payload)
      setShowTeamModal(false); setEditTeamTarget(null)
      toast('success', editTeamTarget ? 'Team updated' : 'Team created')
    } catch (err: any) {
      toast('error', err.message || 'Failed to save team')
    }
  }

  const teamCountByAgent = useMemo(() => {
    const map: Record<string, number> = {}
    for (const team of teams as any[]) {
      for (const id of (team.agentIds || [])) {
        map[id] = (map[id] || 0) + 1
      }
    }
    return map
  }, [teams])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="app-header">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Agent Team</h2>
          <p className="text-ink-3 text-xs mt-0.5">{agents.length} agents · {teams.length} teams</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['agents', 'market', 'teams'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-1 rounded text-xs transition-colors capitalize ${tab === t ? 'text-desktop-accent bg-desktop-accent/10' : 'text-ink-3'}`}
              >
                {t === 'market' ? 'Market' : t === 'agents' ? 'Agents' : 'Teams'}
              </button>
            ))}
          </div>

          {tab === 'agents' && (
            <button onClick={() => { setEditTarget(null); setShowModal(true) }} className="btn-primary">
              <Plus className="w-3.5 h-3.5" /> New Agent
            </button>
          )}
          {tab === 'teams' && (
            <button onClick={() => { setEditTeamTarget(null); setShowTeamModal(true) }} className="btn-primary">
              <Plus className="w-3.5 h-3.5" /> New Team
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-ink-4 animate-spin" /></div>}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-state-error text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> Failed to load agents. Make sure the API server is running.
        </div>
      )}

      {!isLoading && !error && tab === 'agents' && agents.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-ink-4">
          <Bot className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">No agents yet</p>
          <p className="text-xs mt-1 text-ink-disabled mb-4">Install agents from the marketplace to get started</p>
          <button
            onClick={() => setTab('market')}
            className="btn-primary"
          >
            <Store className="w-3.5 h-3.5" /> Browse Market
          </button>
        </div>
      )}

      {!isLoading && tab === 'agents' && agents.length > 0 && (
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
                    {teamCountByAgent[agent.id] ? (
                      <span className="badge text-[10px] text-ink-4 bg-white/5 border-white/10">
                        {teamCountByAgent[agent.id]} team
                      </span>
                    ) : null}
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

      {tab === 'market' && (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="relative flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-ink-4 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={marketSearch}
              onChange={e => setMarketSearch(e.target.value)}
              placeholder="Search agent templates..."
              className="app-input pl-8"
            />
          </div>
          <div className="flex-1 overflow-auto">
            {filteredTemplates.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-4">
                <Store className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm text-ink-3">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemplates.map((tpl: any) => (
                  <div key={tpl.id} className="app-card flex flex-col gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.12)' }}>
                        <Bot className="w-4 h-4 text-state-info" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ink-1 text-sm font-medium truncate">{tpl.name}</p>
                        <p className="text-ink-3 text-xs capitalize">{tpl.role} · {tpl.category}</p>
                      </div>
                    </div>
                    {tpl.description && (
                      <p className="text-ink-4 text-xs line-clamp-2 leading-relaxed">{tpl.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(tpl.tags || []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="badge text-[10px] text-ink-4 bg-white/5 border-white/10">{tag}</span>
                      ))}
                      {tpl.downloads > 0 && (
                        <span className="text-[10px] text-ink-4 ml-auto">{tpl.downloads} installs</span>
                      )}
                    </div>
                    <button
                      onClick={() => installTemplate.mutate(tpl.slug)}
                      disabled={installTemplate.isPending}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs transition-colors"
                      style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa' }}
                    >
                      {installTemplate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      Install Agent
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'teams' && (
        <div className="flex-1 overflow-auto">
          {teamsLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-ink-4 animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-ink-4">
              <Users className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No teams yet</p>
              <p className="text-xs mt-0.5 text-ink-disabled">Create a team for multi-agent collaboration</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(teams as any[]).map((team: any) => (
                <div key={team.id} className="app-card group flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,165,250,0.12)' }}>
                      <Users className="w-4 h-4 text-state-info" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink-1 text-sm font-medium truncate">{team.name}</p>
                      <p className="text-ink-3 text-xs">{team.agentIds?.length || 0} members</p>
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-ink-4 text-xs line-clamp-2 leading-relaxed">{team.description}</p>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`badge ${TEAM_MODE_STYLES[team.communicationMode] || TEAM_MODE_STYLES.sequential}`}>
                      {team.communicationMode}
                    </span>
                    <span className="badge text-ink-4 bg-white/5 border-white/10">
                      {team.sharedContext ? 'shared-context' : 'isolated-context'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-ink-4">
                      coordinator: {
                        team.agents?.find((a: any) => a.id === team.coordinatorId)?.name
                        || team.agents?.[0]?.name
                        || 'auto'
                      }
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditTeamTarget(team); setShowTeamModal(true) }}
                        className="p-1 hover:bg-white/5 rounded transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this team?')) deleteTeam.mutate(team.id) }}
                        className="p-1 hover:bg-state-error/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-state-error/70" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {showTeamModal && (
        <TeamModal
          agents={agents as any[]}
          initial={editTeamTarget}
          saving={createTeam.isPending || updateTeam.isPending}
          onClose={() => { setShowTeamModal(false); setEditTeamTarget(null) }}
          onSave={handleSaveTeam}
        />
      )}
    </div>
  )
}
