import { useState } from 'react'
import { Plus, X, FileText, Edit3, Trash2, Play, Loader2, AlertCircle, Search, ChevronRight, Save } from 'lucide-react'
import { usePrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt, useRenderPrompt } from '../../hooks/usePrompts'

interface PromptFormData {
  name: string
  description: string
  category: string
  template: { system: string; user: string }
  variables: Array<{ name: string; type: string; required: boolean; default?: string }>
}

const defaultForm: PromptFormData = {
  name: '',
  description: '',
  category: '',
  template: { system: '', user: '' },
  variables: [],
}

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{\s*(\w+)\s*\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/\{\{\s*|\s*\}\}/g, '')))]
}

interface PromptModalProps {
  initial?: any
  onClose: () => void
  onSave: (data: PromptFormData) => void
  saving: boolean
}

function PromptModal({ initial, onClose, onSave, saving }: PromptModalProps) {
  const [form, setForm] = useState<PromptFormData>(
    initial
      ? { name: initial.name, description: initial.description || '', category: initial.category || '', template: initial.template, variables: initial.variables || [] }
      : defaultForm
  )

  const set = (key: keyof PromptFormData, val: any) => setForm(f => ({ ...f, [key]: val }))
  const setTpl = (key: 'system' | 'user', val: string) => setForm(f => ({ ...f, template: { ...f.template, [key]: val } }))

  const detectedVars = extractVariables(form.template.user + ' ' + form.template.system)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-desktop-elevated border border-white/10 rounded-xl w-[600px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-semibold">{initial ? 'Edit Prompt' : 'New Prompt Template'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4 text-white/60" /></button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Template name"
                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-desktop-accent focus:outline-none text-sm" />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. writing"
                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-desktop-accent focus:outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1 block">System Prompt (optional)</label>
            <textarea value={form.template.system} onChange={e => setTpl('system', e.target.value)} rows={2}
              placeholder="You are a helpful assistant..."
              className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-desktop-accent focus:outline-none text-sm resize-none" />
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1 block">User Prompt *</label>
            <p className="text-white/30 text-xs mb-1">Use {'{{ variable }}'} syntax for dynamic values</p>
            <textarea value={form.template.user} onChange={e => setTpl('user', e.target.value)} rows={4}
              placeholder="Write a {{tone}} summary of: {{content}}"
              className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-desktop-accent focus:outline-none text-sm resize-none font-mono" />
          </div>

          {detectedVars.length > 0 && (
            <div>
              <label className="text-white/60 text-xs mb-2 block">Detected Variables</label>
              <div className="flex flex-wrap gap-2">
                {detectedVars.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-desktop-accent/20 border border-desktop-accent-border/30 rounded text-xs text-desktop-accent font-mono">
                    {'{{'}{v}{'}}'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 p-5 border-t border-white/10">
          <button onClick={onClose} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || !form.template.user.trim() || saving}
            className="flex-1 py-2 bg-desktop-accent hover:bg-desktop-accent/80 disabled:opacity-50 rounded-lg text-white text-sm flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface TryPromptModalProps {
  prompt: any
  onClose: () => void
}

function TryPromptModal({ prompt, onClose }: TryPromptModalProps) {
  const vars = extractVariables(prompt.template.user + ' ' + (prompt.template.system || ''))
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(vars.map(v => [v, '']))
  )
  const renderPrompt = useRenderPrompt()

  const handleRender = () => {
    renderPrompt.mutate({ id: prompt.id, variables: values })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-desktop-elevated border border-white/10 rounded-xl w-[560px] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-semibold">Try: {prompt.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4 text-white/60" /></button>
        </div>
        <div className="p-5 space-y-3">
          {vars.length === 0 && <p className="text-white/40 text-sm">This template has no variables.</p>}
          {vars.map(v => (
            <div key={v}>
              <label className="text-white/60 text-xs mb-1 block font-mono">{'{{'}{v}{'}}'}</label>
              <input value={values[v] || ''} onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))}
                placeholder={`Enter ${v}...`}
                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-desktop-accent focus:outline-none text-sm" />
            </div>
          ))}

          <button
            onClick={handleRender}
            disabled={renderPrompt.isPending}
            className="w-full py-2 bg-desktop-accent hover:bg-desktop-accent/80 disabled:opacity-50 rounded-lg text-white text-sm flex items-center justify-center gap-2 mt-2"
          >
            {renderPrompt.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Render
          </button>

          {renderPrompt.data && (
            <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10 space-y-2">
              {renderPrompt.data.system && (
                <div>
                  <p className="text-white/40 text-xs mb-1">System:</p>
                  <p className="text-white/70 text-sm whitespace-pre-wrap">{renderPrompt.data.system}</p>
                </div>
              )}
              <div>
                <p className="text-white/40 text-xs mb-1">User:</p>
                <p className="text-white text-sm whitespace-pre-wrap">{renderPrompt.data.rendered}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PromptsApp() {
  const { data: prompts = [], isLoading, error } = usePrompts()
  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const deletePrompt = useDeletePrompt()
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [tryTarget, setTryTarget] = useState<any>(null)
  const [search, setSearch] = useState('')

  const filtered = prompts.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data: PromptFormData) => {
    if (editTarget) {
      await updatePrompt.mutateAsync({ id: editTarget.id, ...data })
    } else {
      await createPrompt.mutateAsync(data)
    }
    setShowModal(false)
    setEditTarget(null)
  }

  const isSaving = createPrompt.isPending || updatePrompt.isPending

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white text-lg font-semibold">Prompt Templates</h2>
          <p className="text-white/40 text-xs mt-0.5">{prompts.length} template{prompts.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true) }}
          className="flex items-center gap-2 px-3 py-1.5 bg-desktop-accent rounded-lg text-white text-sm hover:bg-desktop-accent/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
          className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-desktop-accent focus:outline-none text-sm" />
      </div>

      {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white/40 animate-spin" /></div>}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> Failed to load prompts.
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <FileText className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">{prompts.length === 0 ? 'No templates yet' : 'No matching templates'}</p>
          {prompts.length === 0 && <p className="text-xs mt-1">Create your first prompt template</p>}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="flex-1 overflow-auto space-y-2">
          {filtered.map((prompt: any) => {
            const vars = extractVariables(prompt.template?.user || '')
            return (
              <div key={prompt.id} className="p-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-colors group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white text-sm font-medium">{prompt.name}</h3>
                      {prompt.category && (
                        <span className="text-xs px-1.5 py-0.5 bg-white/5 text-white/40 rounded">{prompt.category}</span>
                      )}
                    </div>
                    {prompt.description && <p className="text-white/40 text-xs mb-1">{prompt.description}</p>}
                    <p className="text-white/30 text-xs font-mono truncate">{prompt.template?.user}</p>
                    {vars.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {vars.map(v => (
                          <span key={v} className="text-xs px-1 bg-desktop-accent/10 text-desktop-accent/70 rounded font-mono">{'{{'}{v}{'}}'}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setTryTarget(prompt)} className="p-1.5 hover:bg-green-500/20 rounded transition-colors" title="Try">
                      <Play className="w-3.5 h-3.5 text-green-400" />
                    </button>
                    <button onClick={() => { setEditTarget(prompt); setShowModal(true) }} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <Edit3 className="w-3.5 h-3.5 text-white/50" />
                    </button>
                    <button onClick={() => deletePrompt.mutate(prompt.id)} className="p-1.5 hover:bg-red-500/20 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400/70" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-white/20 self-center" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <PromptModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSave={handleSave}
          saving={isSaving}
        />
      )}
      {tryTarget && <TryPromptModal prompt={tryTarget} onClose={() => setTryTarget(null)} />}
    </div>
  )
}
