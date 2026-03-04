import { useState } from 'react'
import {
  Puzzle, Download, Trash2, CheckCircle, Loader2, AlertCircle, Search,
  Link2, Plus, Play, X,
} from 'lucide-react'
import { useSkills, useInstallSkill, useUninstallSkill } from '../../hooks/useSkills'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsApi } from '../../lib/api'

const CATEGORY_COLORS: Record<string, { dot: string; bg: string }> = {
  development: { dot: 'bg-blue-400',   bg: 'bg-blue-500/10' },
  design:      { dot: 'bg-purple-400', bg: 'bg-purple-500/10' },
  writing:     { dot: 'bg-green-400',  bg: 'bg-green-500/10' },
  research:    { dot: 'bg-amber-400',  bg: 'bg-amber-500/10' },
  data:        { dot: 'bg-cyan-400',   bg: 'bg-cyan-500/10' },
  automation:  { dot: 'bg-orange-400', bg: 'bg-orange-500/10' },
  communication: { dot: 'bg-pink-400', bg: 'bg-pink-500/10' },
  custom:      { dot: 'bg-ink-3',      bg: 'bg-white/5' },
}

function CreateChainModal({ skills, onClose, onSave, saving }: {
  skills: any[]
  onClose: () => void
  onSave: (data: { name: string; description: string; skillIds: string[] }) => void
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const installed = skills.filter((s: any) => s.installed === 1 || s.installed === true)

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setSelectedIds(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[520px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-ink-1 font-semibold text-sm">New Skill Chain</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg">
            <X className="w-4 h-4 text-ink-3" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Chain Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Research & Summarize" className="app-input" />
          </div>
          <div>
            <label className="text-ink-3 text-xs mb-1.5 block">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What this chain does..." className="app-input" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-ink-2 text-xs font-medium">Skills (execution order)</label>
              <span className="text-ink-4 text-[11px]">{selectedIds.length} selected</span>
            </div>

            {selectedIds.length > 0 && (
              <div className="space-y-1 mb-2">
                {selectedIds.map((id, idx) => {
                  const skill = installed.find((s: any) => s.id === id)
                  return (
                    <div key={id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-ink-4 text-[10px] font-mono w-4">{idx + 1}</span>
                      <span className="text-ink-2 text-xs flex-1">{skill?.name || id}</span>
                      <button onClick={() => moveUp(idx)} className="text-ink-4 hover:text-ink-2 text-[10px]" disabled={idx === 0}>↑</button>
                      <button onClick={() => toggle(id)} className="text-ink-4 hover:text-state-error text-[10px]">×</button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-auto">
              {installed.filter((s: any) => !selectedIds.includes(s.id)).map((skill: any) => (
                <button
                  key={skill.id}
                  onClick={() => toggle(skill.id)}
                  className="text-left px-2 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="text-[11px] text-ink-2 truncate">{skill.name}</div>
                  <div className="text-[10px] text-ink-4">{skill.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => onSave({ name, description, skillIds: selectedIds })}
            disabled={!name.trim() || selectedIds.length === 0 || saving}
            className="btn-primary flex-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
            {saving ? 'Creating…' : 'Create Chain'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SkillsApp() {
  const { data: skills = [], isLoading, error } = useSkills()
  const installSkill = useInstallSkill()
  const uninstallSkill = useUninstallSkill()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'market' | 'installed' | 'chains'>('market')
  const [showChainModal, setShowChainModal] = useState(false)
  const [runInput, setRunInput] = useState('')
  const [runningChainId, setRunningChainId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<any>(null)

  const qc = useQueryClient()
  const { data: chains = [] } = useQuery({ queryKey: ['skill-chains'], queryFn: skillsApi.listChains })
  const createChain = useMutation({
    mutationFn: skillsApi.createChain,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skill-chains'] }),
  })
  const deleteChain = useMutation({
    mutationFn: skillsApi.deleteChain,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skill-chains'] }),
  })

  const handleRunChain = async (chainId: string) => {
    if (!runInput.trim()) return
    setRunningChainId(chainId)
    setRunResult(null)
    try {
      const result = await skillsApi.runChain(chainId, runInput)
      setRunResult(result)
    } catch (err: any) {
      setRunResult({ error: err.message })
    } finally {
      setRunningChainId(null)
    }
  }

  const filtered = skills.filter((s: any) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'installed' ? (s.installed === 1 || s.installed === true) : true
    return matchSearch && matchTab
  })
  const installedCount = skills.filter((s: any) => s.installed === 1 || s.installed === true).length

  return (
    <div className="h-full flex flex-col">
      <div className="app-header">
        <div>
          <h2 className="text-ink-1 text-sm font-semibold">Skills</h2>
          <p className="text-ink-3 text-xs mt-0.5">{installedCount} installed · {(chains as any[]).length} chains</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['market', 'installed', 'chains'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${tab === t ? 'bg-desktop-accent text-white' : 'text-ink-3 hover:text-ink-1'}`}>
            {t} {t === 'installed' && installedCount > 0 ? `(${installedCount})` : t === 'chains' && (chains as any[]).length > 0 ? `(${(chains as any[]).length})` : ''}
          </button>
        ))}
      </div>

      {/* Skills tabs (market + installed) */}
      {(tab === 'market' || tab === 'installed') && (
        <>
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-ink-4 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills…" className="app-input pl-8" />
          </div>

          {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-ink-4 animate-spin" /></div>}
          {error && <div className="flex items-center gap-2 p-3 rounded-lg text-state-error text-xs" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}><AlertCircle className="w-4 h-4" /> Failed to load skills.</div>}

          {!isLoading && filtered.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-ink-4">
              <Puzzle className="w-8 h-8 mb-2 opacity-30" strokeWidth={1.5} />
              <p className="text-sm text-ink-3">{tab === 'installed' ? 'No installed skills' : 'No skills found'}</p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex-1 overflow-auto space-y-1.5">
              {filtered.map((skill: any) => {
                const isInstalled = skill.installed === 1 || skill.installed === true
                const colors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.custom
                const isInstalling = installSkill.isPending && installSkill.variables === skill.slug
                const isUninstalling = uninstallSkill.isPending && uninstallSkill.variables === skill.slug

                return (
                  <div key={skill.id} className="app-card flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-ink-1 text-xs font-medium">{skill.name}</span>
                        {isInstalled && <CheckCircle className="w-3 h-3 text-state-success flex-shrink-0" strokeWidth={2} />}
                      </div>
                      <p className="text-ink-4 text-[11px] truncate">{skill.description}</p>
                    </div>
                    {isInstalled ? (
                      <button onClick={() => uninstallSkill.mutate(skill.slug)} disabled={isUninstalling}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-ink-3 hover:text-state-error transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {isUninstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Remove
                      </button>
                    ) : (
                      <button onClick={() => installSkill.mutate(skill.slug)} disabled={isInstalling}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-desktop-accent transition-colors"
                        style={{ background: 'rgba(232,76,106,0.10)', border: '1px solid rgba(232,76,106,0.20)' }}>
                        {isInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Install
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Chains tab */}
      {tab === 'chains' && (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <button onClick={() => setShowChainModal(true)} className="btn-primary self-start">
            <Plus className="w-3.5 h-3.5" /> New Chain
          </button>

          {(chains as any[]).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-ink-4">
              <Link2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm text-ink-3">No skill chains yet</p>
              <p className="text-xs mt-0.5 text-ink-disabled">Chain multiple skills into automated pipelines</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto space-y-2">
              {(chains as any[]).map((chain: any) => (
                <div key={chain.id} className="app-card space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-ink-1 text-xs font-medium">{chain.name}</p>
                      {chain.description && <p className="text-ink-4 text-[11px]">{chain.description}</p>}
                    </div>
                    <button onClick={() => deleteChain.mutate(chain.id)} className="p-1 hover:bg-state-error/10 rounded">
                      <Trash2 className="w-3 h-3 text-state-error/70" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(chain.skillIds || []).map((id: string, idx: number) => {
                      const skill = (skills as any[]).find(s => s.id === id)
                      return (
                        <span key={id} className="flex items-center gap-1">
                          <span className="badge text-[10px] text-ink-3 bg-white/5 border-white/10">{skill?.name || id.slice(0, 8)}</span>
                          {idx < (chain.skillIds || []).length - 1 && <span className="text-ink-4 text-[10px]">→</span>}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={runResult?.chainId === chain.id ? '' : runInput}
                      onChange={e => setRunInput(e.target.value)}
                      placeholder="Enter input to run chain..."
                      className="app-input flex-1 text-xs py-1"
                      onFocus={() => setRunResult(null)}
                    />
                    <button
                      onClick={() => handleRunChain(chain.id)}
                      disabled={runningChainId === chain.id || !runInput.trim()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-state-success transition-colors disabled:opacity-40"
                      style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}
                    >
                      {runningChainId === chain.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Run
                    </button>
                  </div>
                  {runResult?.chainId === chain.id && (
                    <div className="text-[11px] p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {runResult.error ? (
                        <span className="text-state-error">{runResult.error}</span>
                      ) : (
                        <div className="space-y-1">
                          {runResult.results?.map((r: any, i: number) => (
                            <div key={i}>
                              <span className="text-ink-3">{r.skillName}:</span>
                              <span className="text-ink-2 ml-1">{r.output.slice(0, 100)}{r.output.length > 100 ? '...' : ''}</span>
                            </div>
                          ))}
                          <div className="pt-1 border-t border-white/5 text-ink-1 font-medium">
                            Final: {runResult.finalOutput?.slice(0, 200)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showChainModal && (
        <CreateChainModal
          skills={skills as any[]}
          saving={createChain.isPending}
          onClose={() => setShowChainModal(false)}
          onSave={async (data) => {
            await createChain.mutateAsync(data)
            setShowChainModal(false)
          }}
        />
      )}
    </div>
  )
}
