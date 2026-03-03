import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: Date
  read: boolean
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (n) => {
    const notif: Notification = { ...n, id: crypto.randomUUID(), timestamp: new Date(), read: false }
    set(s => ({ notifications: [notif, ...s.notifications].slice(0, 50) }))
  },

  markRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),

  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
  })),

  dismiss: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id),
  })),

  clearAll: () => set({ notifications: [] }),
}))
