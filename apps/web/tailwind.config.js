/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        desktop: {
          // ── 精确协议 (Precision Protocol) — 中性 zinc 深色系 ──
          bg:       '#0C0C0E',   // 主背景 — 近黑，不带蓝紫色调
          surface:  '#18181B',   // 卡片/面板 — zinc-900
          dock:     '#1C1C1F',   // 标题栏/dock — 略亮于 surface
          window:   '#18181B',   // 窗口内容区
          elevated: '#232329',   // 悬浮层 (modal, dropdown, hover)
          accent:   '#E84C6A',   // 珊瑚红 — 品牌唯一 accent (8-12% 面积)
          'accent-muted':  'rgba(232,76,106,0.12)',
          'accent-border': 'rgba(232,76,106,0.25)',
        },
        // 文字层级系统
        ink: {
          1: '#FAFAFA',          // 主要文字
          2: '#A1A1AA',          // 次要 — zinc-400
          3: '#71717A',          // 辅助 — zinc-500
          4: '#52525B',          // 弱化 — zinc-600
          disabled: '#3F3F46',   // 禁用 — zinc-700
        },
        // 语义状态色 (WCAG AA 深色模式)
        state: {
          success: '#4ADE80',
          warning: '#FBBF24',
          error:   '#F87171',
          info:    '#60A5FA',
        },
      },
      borderRadius: {
        sm:  '6px',
        md:  '8px',
        lg:  '10px',
        xl:  '12px',
        '2xl': '16px',
      },
      boxShadow: {
        // 阳极氧化铝光影 — 深阴影，无发光
        'window':  '0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px -8px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.4)',
        'dock':    'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -8px rgba(0,0,0,0.55)',
        'menu':    '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
        'modal':   '0 0 0 1px rgba(255,255,255,0.06), 0 48px 96px -16px rgba(0,0,0,0.8)',
        'card':    'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':  'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                                     to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(6px)' },       to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.97)' },           to: { opacity: '1', transform: 'scale(1)' } },
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backdropBlur: {
        'dock': '32px',
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
