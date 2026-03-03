import { useState } from 'react'
import { Bell, X, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { useNotificationStore, Notification } from '../stores/notificationStore'

const TYPE_CONFIG = {
  info:    { Icon: Info,          color: 'text-state-info',    bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.15)' },
  success: { Icon: CheckCircle,   color: 'text-state-success', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.15)' },
  warning: { Icon: AlertTriangle, color: 'text-state-warning', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)' },
  error:   { Icon: AlertCircle,   color: 'text-state-error',   bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' },
}

function NotifItem({ notif, onRead, onDismiss }: { notif: Notification; onRead: () => void; onDismiss: () => void }) {
  const { Icon, color, bg, border } = TYPE_CONFIG[notif.type]
  return (
    <div onClick={onRead} className="relative p-3 rounded-lg cursor-pointer group transition-colors"
      style={{ background: bg, border: `1px solid ${border}`, opacity: notif.read ? 0.55 : 1 }}>
      <div className="flex items-start gap-2">
        <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0 mt-0.5`} strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <p className="text-ink-1 text-xs font-medium leading-snug">{notif.title}</p>
          {notif.message && <p className="text-ink-3 text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>}
          <p className="text-ink-4 text-[10px] mt-1.5">{notif.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDismiss() }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/8 rounded transition-all">
          <X className="w-3 h-3 text-ink-4" />
        </button>
      </div>
      {!notif.read && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-desktop-accent" />}
    </div>
  )
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const { notifications, markRead, markAllRead, dismiss, clearAll } = useNotificationStore()
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/8"
        style={{ background: open ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
        <Bell className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-desktop-accent rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-68 rounded-xl z-[9999] overflow-hidden shadow-menu"
            style={{ width: '272px', background: 'rgba(22,22,26,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-ink-2 text-xs font-medium">Notifications</span>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} title="Mark all read" className="p-1 hover:bg-white/5 rounded transition-colors">
                    <CheckCheck className="w-3.5 h-3.5 text-ink-4" strokeWidth={1.75} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} title="Clear all" className="p-1 hover:bg-white/5 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-ink-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-72 overflow-auto p-2 space-y-1.5">
              {notifications.length === 0 && (
                <div className="text-center text-ink-4 text-xs py-8">No notifications</div>
              )}
              {notifications.map(n => (
                <NotifItem key={n.id} notif={n} onRead={() => markRead(n.id)} onDismiss={() => dismiss(n.id)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
