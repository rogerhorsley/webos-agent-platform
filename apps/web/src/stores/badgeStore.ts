import { create } from 'zustand'

interface BadgeState {
  taskRunningCount: number
  chatUnread: number
  setTaskRunningCount: (count: number) => void
  incrementChatUnread: () => void
  resetChatUnread: () => void
}

export const useBadgeStore = create<BadgeState>((set) => ({
  taskRunningCount: 0,
  chatUnread: 0,
  setTaskRunningCount: (count) => set({ taskRunningCount: count }),
  incrementChatUnread: () => set((s) => ({ chatUnread: s.chatUnread + 1 })),
  resetChatUnread: () => set({ chatUnread: 0 }),
}))
