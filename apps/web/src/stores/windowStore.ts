import { create } from 'zustand'

export interface Window {
  id: string
  title: string
  icon: string
  component: string
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}

interface WindowState {
  windows: Window[]
  activeWindowId: string | null
  nextZIndex: number

  openWindow: (app: { id: string; title: string; icon: string; component: string }) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPosition: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  nextZIndex: 1,

  openWindow: (app) => {
    const { windows, nextZIndex } = get()
    const existingWindow = windows.find(w => w.id === app.id)

    if (existingWindow) {
      // Focus existing window
      get().focusWindow(app.id)
      if (existingWindow.isMinimized) {
        set({
          windows: windows.map(w =>
            w.id === app.id ? { ...w, isMinimized: false } : w
          )
        })
      }
      return
    }

    const newWindow: Window = {
      id: app.id,
      title: app.title,
      icon: app.icon,
      component: app.component,
      x: 100 + (windows.length * 30),
      y: 100 + (windows.length * 30),
      width: 800,
      height: 600,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
    }

    set({
      windows: [...windows, newWindow],
      activeWindowId: app.id,
      nextZIndex: nextZIndex + 1,
    })
  },

  closeWindow: (id) => {
    const { windows, activeWindowId } = get()
    const newWindows = windows.filter(w => w.id !== id)
    set({
      windows: newWindows,
      activeWindowId: activeWindowId === id
        ? newWindows[newWindows.length - 1]?.id || null
        : activeWindowId,
    })
  },

  minimizeWindow: (id) => {
    set({
      windows: get().windows.map(w =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
    })
  },

  maximizeWindow: (id) => {
    set({
      windows: get().windows.map(w =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })
  },

  focusWindow: (id) => {
    const { windows, nextZIndex } = get()
    set({
      windows: windows.map(w =>
        w.id === id ? { ...w, zIndex: nextZIndex } : w
      ),
      activeWindowId: id,
      nextZIndex: nextZIndex + 1,
    })
  },

  updateWindowPosition: (id, x, y) => {
    set({
      windows: get().windows.map(w =>
        w.id === id ? { ...w, x, y } : w
      ),
    })
  },

  updateWindowSize: (id, width, height) => {
    set({
      windows: get().windows.map(w =>
        w.id === id ? { ...w, width, height } : w
      ),
    })
  },
}))
