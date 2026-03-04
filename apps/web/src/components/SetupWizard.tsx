import { useState } from 'react'
import {
  Sparkles, Key, Puzzle, Bot, Zap, ChevronRight, ChevronLeft,
  CheckCircle, Loader2, Eye, EyeOff, ImageIcon, Rocket,
} from 'lucide-react'
import { useWallpaperStore, WALLPAPERS } from '../stores/wallpaperStore'
import { agentsApi, skillsApi } from '../lib/api'
import { useQuery } from '@tanstack/react-query'

const STEPS = ['welcome', 'apikey', 'wallpaper', 'skills', 'agents', 'dispatch', 'done'] as const
type Step = typeof STEPS[number]

const SKILL_CATEGORIES: Record<string, { label: string; color: string }> = {
  development: { label: '开发', color: '#60A5FA' },
  writing: { label: '写作', color: '#34D399' },
  data: { label: '数据', color: '#FBBF24' },
  research: { label: '研究', color: '#A78BFA' },
  automation: { label: '自动化', color: '#F472B6' },
  design: { label: '设计', color: '#FB923C' },
  communication: { label: '沟通', color: '#22D3EE' },
}

const RECOMMENDED_SKILLS = ['web-search', 'code-review', 'document-writer', 'summarizer', 'translator', 'shell-expert']
const RECOMMENDED_TEMPLATES = ['writing-assistant', 'code-reviewer', 'researcher', 'data-analyst']

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
          i < current ? 'bg-desktop-accent w-6' : i === current ? 'bg-desktop-accent/60 w-4' : 'bg-white/10 w-3'
        }`} />
      ))}
    </div>
  )
}

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('welcome')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set(RECOMMENDED_SKILLS))
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set(RECOMMENDED_TEMPLATES))
  const [dispatchMode, setDispatchMode] = useState('auto')
  const [installing, setInstalling] = useState(false)
  const { activeId, setWallpaper } = useWallpaperStore()

  const { data: skills = [] } = useQuery({ queryKey: ['setup-skills'], queryFn: skillsApi.list })
  const { data: templates = [] } = useQuery({ queryKey: ['setup-templates'], queryFn: agentsApi.listTemplates })

  const stepIdx = STEPS.indexOf(step)
  const canNext = step === 'apikey' ? apiKey.trim().length > 0 : true

  const next = () => {
    const i = STEPS.indexOf(step)
    if (i < STEPS.length - 1) setStep(STEPS[i + 1])
  }
  const prev = () => {
    const i = STEPS.indexOf(step)
    if (i > 0) setStep(STEPS[i - 1])
  }

  const toggleSkill = (slug: string) => {
    setSelectedSkills(prev => {
      const s = new Set(prev)
      s.has(slug) ? s.delete(slug) : s.add(slug)
      return s
    })
  }

  const toggleTemplate = (slug: string) => {
    setSelectedTemplates(prev => {
      const s = new Set(prev)
      s.has(slug) ? s.delete(slug) : s.add(slug)
      return s
    })
  }

  const handleFinish = async () => {
    setInstalling(true)
    try {
      if (apiKey) localStorage.setItem('anthropic_api_key', apiKey)
      localStorage.setItem('nexus_dispatch_mode', dispatchMode)

      for (const slug of selectedSkills) {
        try { await skillsApi.install(slug) } catch {}
      }
      for (const slug of selectedTemplates) {
        try { await agentsApi.installTemplate(slug) } catch {}
      }

      localStorage.setItem('nexusos_onboarding_done', '1')
      onComplete()
    } catch {
      localStorage.setItem('nexusos_onboarding_done', '1')
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(232,76,106,0.08) 0%, transparent 60%), #0C0C0E' }}>
      <div className="w-[640px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(20,20,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="px-8 pt-6 pb-4 flex items-center justify-between">
          <StepIndicator current={stepIdx} total={STEPS.length} />
          <span className="text-white/30 text-[11px]">{stepIdx + 1} / {STEPS.length}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-8 pb-6">
          {step === 'welcome' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #E84C6A 0%, #D946A8 100%)' }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-white text-2xl font-bold mb-3">欢迎使用 NexusOS</h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-md">
                你的 AI 工作操作系统。让我们花一分钟完成初始配置，<br />
                设置 API Key、选择需要的技能和 Agent，马上开始使用。
              </p>
            </div>
          )}

          {step === 'apikey' && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,76,106,0.15)' }}>
                  <Key className="w-5 h-5 text-desktop-accent" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">配置 API Key</h2>
                  <p className="text-white/40 text-xs">NexusOS 通过 OpenRouter / Anthropic API 驱动 AI 能力</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-xs mb-2 block">Anthropic / OpenRouter API Key</label>
                  <div className="relative">
                    <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-ant-... 或 sk-or-v1-..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm placeholder-white/20 focus:border-desktop-accent/50 focus:outline-none pr-10" />
                    <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-lg">
                      {showKey ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
                    </button>
                  </div>
                  <p className="text-white/30 text-[11px] mt-2">
                    从 <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-desktop-accent/70 hover:text-desktop-accent">console.anthropic.com</a> 或{' '}
                    <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-desktop-accent/70 hover:text-desktop-accent">openrouter.ai</a> 获取
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.7)' }}>
                    💡 如果后端已通过环境变量 <code className="font-mono">ANTHROPIC_API_KEY</code> 配置，可跳过此步骤。
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'wallpaper' && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">选择桌面壁纸</h2>
                  <p className="text-white/40 text-xs">为你的工作空间选择一个喜欢的主题</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {WALLPAPERS.map(wp => {
                  const isActive = wp.id === activeId
                  return (
                    <button key={wp.id} onClick={() => setWallpaper(wp.id)}
                      className="group relative rounded-xl overflow-hidden transition-all"
                      style={{
                        aspectRatio: '16/9', background: wp.preview,
                        border: isActive ? '2px solid #E84C6A' : '2px solid rgba(255,255,255,0.06)',
                        boxShadow: isActive ? '0 0 0 1px rgba(232,76,106,0.3)' : 'none',
                      }}>
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <span className="text-[10px] font-medium text-white/80">{wp.name}</span>
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-desktop-accent flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'skills' && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)' }}>
                  <Puzzle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">选择技能 Skills</h2>
                  <p className="text-white/40 text-xs">选择 Agent 可使用的技能插件（推荐项已预选，可随时更改）</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setSelectedSkills(new Set(skills.map((s: any) => s.slug)))}
                  className="text-[11px] text-desktop-accent/70 hover:text-desktop-accent">全选</button>
                <span className="text-white/20">|</span>
                <button onClick={() => setSelectedSkills(new Set())}
                  className="text-[11px] text-white/40 hover:text-white/60">全不选</button>
                <span className="text-white/20">|</span>
                <button onClick={() => setSelectedSkills(new Set(RECOMMENDED_SKILLS))}
                  className="text-[11px] text-green-400/70 hover:text-green-400">推荐</button>
                <span className="ml-auto text-white/30 text-[11px]">{selectedSkills.size} / {skills.length} 已选</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto pr-1">
                {skills.map((skill: any) => {
                  const selected = selectedSkills.has(skill.slug)
                  const cat = SKILL_CATEGORIES[skill.category] || { label: skill.category, color: '#888' }
                  const isRecommended = RECOMMENDED_SKILLS.includes(skill.slug)
                  return (
                    <button key={skill.slug} onClick={() => toggleSkill(skill.slug)}
                      className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: selected ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
                        border: selected ? '1px solid rgba(96,165,250,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        selected ? 'bg-blue-500' : 'bg-white/10'
                      }`}>
                        {selected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${selected ? 'text-white' : 'text-white/60'}`}>{skill.name}</span>
                          {isRecommended && <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/15 text-green-400">推荐</span>}
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{skill.description}</p>
                        <span className="text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded-full" style={{ background: `${cat.color}15`, color: cat.color }}>{cat.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'agents' && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <Bot className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">安装 Agent 模板</h2>
                  <p className="text-white/40 text-xs">选择要预装的专家 Agent（推荐项已预选，可随时从市场安装更多）</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setSelectedTemplates(new Set(templates.map((t: any) => t.slug)))}
                  className="text-[11px] text-desktop-accent/70 hover:text-desktop-accent">全选</button>
                <span className="text-white/20">|</span>
                <button onClick={() => setSelectedTemplates(new Set())}
                  className="text-[11px] text-white/40 hover:text-white/60">全不选</button>
                <span className="text-white/20">|</span>
                <button onClick={() => setSelectedTemplates(new Set(RECOMMENDED_TEMPLATES))}
                  className="text-[11px] text-green-400/70 hover:text-green-400">推荐</button>
                <span className="ml-auto text-white/30 text-[11px]">{selectedTemplates.size} / {templates.length} 已选</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto pr-1">
                {templates.map((tpl: any) => {
                  const selected = selectedTemplates.has(tpl.slug)
                  const isRecommended = RECOMMENDED_TEMPLATES.includes(tpl.slug)
                  return (
                    <button key={tpl.slug} onClick={() => toggleTemplate(tpl.slug)}
                      className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: selected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                        border: selected ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        selected ? 'bg-green-500' : 'bg-white/10'
                      }`}>
                        {selected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg mr-0.5">{tpl.icon || '🤖'}</span>
                          <span className={`text-xs font-medium ${selected ? 'text-white' : 'text-white/60'}`}>{tpl.name}</span>
                          {isRecommended && <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/15 text-green-400">推荐</span>}
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{tpl.description}</p>
                        <span className="text-[9px] text-white/20 mt-0.5">{tpl.role}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'dispatch' && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">NexusCore 派活模式</h2>
                  <p className="text-white/40 text-xs">选择 NexusCore 主助手如何处理复杂任务</p>
                </div>
              </div>
              <div className="space-y-3">
                <button onClick={() => setDispatchMode('auto')}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    background: dispatchMode === 'auto' ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.02)',
                    border: dispatchMode === 'auto' ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${dispatchMode === 'auto' ? 'text-green-400' : 'text-white/30'}`} />
                    <span className={`text-sm font-medium ${dispatchMode === 'auto' ? 'text-green-300' : 'text-white/60'}`}>⚡ 自动执行</span>
                  </div>
                  <p className="text-white/40 text-xs pl-6">NexusCore 识别意图后直接创建任务并派活给合适的 Agent，无需确认。适合追求效率的用户。</p>
                </button>
                <button onClick={() => setDispatchMode('confirm')}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    background: dispatchMode === 'confirm' ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
                    border: dispatchMode === 'confirm' ? '1px solid rgba(96,165,250,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className={`w-4 h-4 ${dispatchMode === 'confirm' ? 'text-blue-400' : 'text-white/30'}`} />
                    <span className={`text-sm font-medium ${dispatchMode === 'confirm' ? 'text-blue-300' : 'text-white/60'}`}>🔍 确认后执行</span>
                  </div>
                  <p className="text-white/40 text-xs pl-6">NexusCore 先展示执行方案，由你确认后再执行。适合需要掌控感的用户。</p>
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #34D399 0%, #22D3EE 100%)' }}>
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-white text-2xl font-bold mb-3">一切就绪！</h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-md mb-6">
                {selectedSkills.size > 0 && `${selectedSkills.size} 个技能`}
                {selectedSkills.size > 0 && selectedTemplates.size > 0 && '、'}
                {selectedTemplates.size > 0 && `${selectedTemplates.size} 个 Agent 模板`}
                {(selectedSkills.size > 0 || selectedTemplates.size > 0) && ' 将被安装。'}
                <br />点击下方按钮开始使用 NexusOS。
              </p>
              <div className="grid grid-cols-3 gap-4 text-center mb-4 w-full max-w-sm">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white text-lg font-bold">{selectedSkills.size}</p>
                  <p className="text-white/30 text-[10px]">Skills</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white text-lg font-bold">{selectedTemplates.size}</p>
                  <p className="text-white/30 text-[10px]">Agents</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white text-lg font-bold capitalize">{dispatchMode === 'auto' ? '⚡' : '🔍'}</p>
                  <p className="text-white/30 text-[10px]">{dispatchMode === 'auto' ? '自动' : '确认'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between">
          <div>
            {stepIdx > 0 && step !== 'done' && (
              <button onClick={prev} className="flex items-center gap-1 px-4 py-2 text-white/50 hover:text-white/80 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> 上一步
              </button>
            )}
            {step === 'apikey' && (
              <button onClick={next} className="text-white/30 hover:text-white/50 text-[11px] ml-2 transition-colors">
                跳过 →
              </button>
            )}
          </div>
          <div>
            {step !== 'done' ? (
              <button onClick={next} disabled={!canNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #E84C6A 0%, #D946A8 100%)', color: 'white' }}>
                {step === 'welcome' ? '开始配置' : '下一步'} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={installing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #34D399 0%, #22D3EE 100%)', color: 'white' }}>
                {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {installing ? '正在配置...' : '🚀 开始使用'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
