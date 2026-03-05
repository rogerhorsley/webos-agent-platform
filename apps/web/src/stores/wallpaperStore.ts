import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Wallpaper {
  id: string
  name: string
  /** CSS background value (gradient or color) */
  css: string
  /** Preview thumbnail CSS (same or simplified) */
  preview: string
  /** Theme mode — drives global CSS variable switch */
  theme: 'dark' | 'light'
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'void',
    name: '虚空',
    css: '#0C0C0E',
    preview: '#0C0C0E',
    theme: 'dark',
  },
  {
    id: 'aurora',
    name: '极光',
    css: `radial-gradient(ellipse 80% 60% at 20% 80%, rgba(56,189,160,0.28) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 80% 20%, rgba(124,58,237,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 50% 50%, rgba(14,165,233,0.1) 0%, transparent 60%),
          #080c10`,
    preview: `radial-gradient(ellipse 80% 60% at 20% 80%, rgba(56,189,160,0.4) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 80% 20%, rgba(124,58,237,0.35) 0%, transparent 55%),
              #080c10`,
    theme: 'dark',
  },
  {
    id: 'dusk',
    name: '黄昏',
    css: `radial-gradient(ellipse 90% 60% at 70% 100%, rgba(251,113,133,0.3) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 30% 80%, rgba(251,191,36,0.18) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 55%),
          #0e0910`,
    preview: `radial-gradient(ellipse 90% 60% at 70% 100%, rgba(251,113,133,0.45) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 20% 80%, rgba(251,191,36,0.3) 0%, transparent 50%),
              #0e0910`,
    theme: 'dark',
  },
  {
    id: 'ocean',
    name: '深海',
    css: `radial-gradient(ellipse 80% 70% at 50% 110%, rgba(6,182,212,0.25) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 80% 30%, rgba(59,130,246,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 10% 60%, rgba(14,116,144,0.2) 0%, transparent 50%),
          #05080f`,
    preview: `radial-gradient(ellipse 80% 70% at 50% 110%, rgba(6,182,212,0.4) 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(59,130,246,0.3) 0%, transparent 55%),
              #05080f`,
    theme: 'dark',
  },
  {
    id: 'nebula',
    name: '星云',
    css: `radial-gradient(ellipse 70% 60% at 80% 60%, rgba(168,85,247,0.28) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 20% 40%, rgba(236,72,153,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 90%, rgba(99,102,241,0.2) 0%, transparent 50%),
          #0a070f`,
    preview: `radial-gradient(ellipse 70% 60% at 80% 60%, rgba(168,85,247,0.45) 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 20% 40%, rgba(236,72,153,0.35) 0%, transparent 55%),
              #0a070f`,
    theme: 'dark',
  },
  {
    id: 'forest',
    name: '林雾',
    css: `radial-gradient(ellipse 80% 60% at 30% 70%, rgba(34,197,94,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 70% 30%, rgba(20,184,166,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 100%, rgba(16,185,129,0.15) 0%, transparent 50%),
          #050e0a`,
    preview: `radial-gradient(ellipse 80% 60% at 30% 70%, rgba(34,197,94,0.35) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 70% 30%, rgba(20,184,166,0.3) 0%, transparent 55%),
              #050e0a`,
    theme: 'dark',
  },
  {
    id: 'ember',
    name: '余烬',
    css: `radial-gradient(ellipse 80% 60% at 60% 80%, rgba(239,68,68,0.25) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 20% 60%, rgba(249,115,22,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 80% 20%, rgba(234,179,8,0.12) 0%, transparent 50%),
          #0f0804`,
    preview: `radial-gradient(ellipse 80% 60% at 60% 80%, rgba(239,68,68,0.4) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 20% 60%, rgba(249,115,22,0.3) 0%, transparent 55%),
              #0f0804`,
    theme: 'dark',
  },
  {
    id: 'glacier',
    name: '冰川',
    css: `radial-gradient(ellipse 80% 60% at 20% 30%, rgba(186,230,253,0.15) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 70% 70%, rgba(147,197,253,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 0%, rgba(224,242,254,0.08) 0%, transparent 50%),
          #07090f`,
    preview: `radial-gradient(ellipse 80% 60% at 20% 30%, rgba(186,230,253,0.3) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 70% 70%, rgba(147,197,253,0.3) 0%, transparent 55%),
              #07090f`,
    theme: 'dark',
  },
  {
    id: 'rose',
    name: '玫瑰',
    css: `radial-gradient(ellipse 80% 70% at 80% 20%, rgba(244,114,182,0.22) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 20% 80%, rgba(251,113,133,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 50%, rgba(217,70,239,0.1) 0%, transparent 50%),
          #0f080d`,
    preview: `radial-gradient(ellipse 80% 70% at 80% 20%, rgba(244,114,182,0.38) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 20% 80%, rgba(251,113,133,0.3) 0%, transparent 55%),
              #0f080d`,
    theme: 'dark',
  },

  // ── Light Themes ──────────────────────────────────────────────────────────

  {
    id: 'light-clean',
    name: '纯白',
    css: `radial-gradient(ellipse 100% 80% at 50% 0%, rgba(248,248,252,1) 0%, rgba(240,240,248,1) 100%)`,
    preview: `linear-gradient(135deg, #F8F8FC 0%, #EBEBF5 100%)`,
    theme: 'light',
  },
  {
    id: 'light-warm',
    name: '暖白',
    css: `radial-gradient(ellipse 90% 70% at 30% 20%, rgba(255,248,240,1) 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 80% 80%, rgba(255,235,210,0.6) 0%, transparent 55%),
          #FAF6F0`,
    preview: `radial-gradient(ellipse 90% 70% at 30% 20%, rgba(255,248,240,1) 0%, transparent 60%),
              #FAF6F0`,
    theme: 'light',
  },
  {
    id: 'light-sky',
    name: '天蓝',
    css: `radial-gradient(ellipse 80% 60% at 70% 10%, rgba(219,234,254,0.8) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 20% 70%, rgba(191,219,254,0.5) 0%, transparent 55%),
          #EFF6FF`,
    preview: `radial-gradient(ellipse 80% 60% at 70% 10%, rgba(219,234,254,1) 0%, transparent 55%),
              #EFF6FF`,
    theme: 'light',
  },
  {
    id: 'light-mint',
    name: '薄荷',
    css: `radial-gradient(ellipse 80% 60% at 20% 20%, rgba(209,250,229,0.9) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 80% 80%, rgba(167,243,208,0.5) 0%, transparent 55%),
          #F0FDF9`,
    preview: `radial-gradient(ellipse 80% 60% at 20% 20%, rgba(209,250,229,1) 0%, transparent 55%),
              #F0FDF9`,
    theme: 'light',
  },
  {
    id: 'light-rose',
    name: '樱花',
    css: `radial-gradient(ellipse 80% 60% at 80% 20%, rgba(252,231,243,0.9) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 20% 80%, rgba(251,207,232,0.5) 0%, transparent 55%),
          #FDF2F8`,
    preview: `radial-gradient(ellipse 80% 60% at 80% 20%, rgba(252,231,243,1) 0%, transparent 55%),
              #FDF2F8`,
    theme: 'light',
  },
]

interface WallpaperState {
  activeId: string
  setWallpaper: (id: string) => void
  getActive: () => Wallpaper
}

function applyTheme(id: string) {
  const wallpaper = WALLPAPERS.find(w => w.id === id) ?? WALLPAPERS[0]
  document.documentElement.setAttribute('data-theme', wallpaper.theme)
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set, get) => ({
      activeId: 'void',
      setWallpaper: (id) => {
        set({ activeId: id })
        applyTheme(id)
      },
      getActive: () => WALLPAPERS.find(w => w.id === get().activeId) ?? WALLPAPERS[0],
    }),
    {
      name: 'nexusos-wallpaper',
      onRehydrateStorage: () => (state) => {
        // Re-apply theme on page load from persisted state
        if (state?.activeId) applyTheme(state.activeId)
      },
    }
  )
)
