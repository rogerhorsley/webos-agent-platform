import { useState } from 'react'
import { Puzzle, Download, Trash2, CheckCircle, Loader2, AlertCircle, Search } from 'lucide-react'
import { useSkills, useInstallSkill, useUninstallSkill } from '../../hooks/useSkills'

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

export function SkillsApp() {
  const { data: skills = [], isLoading, error } = useSkills()
  const installSkill = useInstallSkill()
  const uninstallSkill = useUninstallSkill()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'market' | 'installed'>('market')

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
          <p className="text-ink-3 text-xs mt-0.5">{installedCount} installed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 p-1 rounded-lg w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['market', 'installed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${tab === t ? 'bg-desktop-accent text-white' : 'text-ink-3 hover:text-ink-1'}`}>
            {t} {t === 'installed' && installedCount > 0 && `(${installedCount})`}
          </button>
        ))}
      </div>

      {/* Search */}
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
    </div>
  )
}
