import { useState } from 'react'
import {
  Mail, Trash2, Inbox, Send, RefreshCw, Loader2, X,
  Pencil, Settings,
} from 'lucide-react'
import {
  useMailAccounts, useCreateMailAccount, useDeleteMailAccount,
  useMailMessages, useFetchInbox, useGetMessageBody,
  useSendMail, useMarkMailRead, useDeleteMailMessage,
} from '../../hooks/useMail'

function AddAccountModal({ onClose, onSave, saving }: {
  onClose: () => void; onSave: (data: any) => void; saving: boolean
}) {
  const [form, setForm] = useState({
    email: '', name: '', imapHost: '', imapPort: 993,
    smtpHost: '', smtpPort: 587, username: '', password: '',
  })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-ink-1 font-semibold text-sm">Add Mail Account</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg"><X className="w-4 h-4 text-ink-3" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1 block">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="app-input" />
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1 block">Display Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Email" className="app-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1 block">IMAP Host</label>
              <input value={form.imapHost} onChange={e => setForm(f => ({ ...f, imapHost: e.target.value }))} placeholder="imap.gmail.com" className="app-input font-mono" />
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1 block">IMAP Port</label>
              <input type="number" value={form.imapPort} onChange={e => setForm(f => ({ ...f, imapPort: +e.target.value }))} className="app-input font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1 block">SMTP Host</label>
              <input value={form.smtpHost} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" className="app-input font-mono" />
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1 block">SMTP Port</label>
              <input type="number" value={form.smtpPort} onChange={e => setForm(f => ({ ...f, smtpPort: +e.target.value }))} className="app-input font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-ink-3 text-xs mb-1 block">Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="app-input font-mono" />
            </div>
            <div>
              <label className="text-ink-3 text-xs mb-1 block">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="app-input font-mono" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.email || !form.imapHost || !form.smtpHost}
            className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Account'}</button>
        </div>
      </div>
    </div>
  )
}

function ComposeModal({ accountId, onClose, onSend, sending }: {
  accountId: string; onClose: () => void; onSend: (data: any) => void; sending: boolean
}) {
  const [form, setForm] = useState({ to: '', subject: '', body: '' })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal w-[560px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-ink-1 font-semibold text-sm flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Compose
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg"><X className="w-4 h-4 text-ink-3" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-ink-3 text-xs mb-1 block">To</label>
            <input value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} placeholder="recipient@example.com" className="app-input" />
          </div>
          <div>
            <label className="text-ink-3 text-xs mb-1 block">Subject</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject" className="app-input" />
          </div>
          <div>
            <label className="text-ink-3 text-xs mb-1 block">Body</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8}
              placeholder="Write your message..."
              className="app-input resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSend({ accountId, ...form })} disabled={sending || !form.to || !form.subject}
            className="btn-primary flex items-center gap-1">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </div>
      </div>
    </div>
  )
}

export function MailApp() {
  const { data: accounts = [], isLoading: loadingAccounts } = useMailAccounts()
  const createAccount = useCreateMailAccount()
  const deleteAccount = useDeleteMailAccount()
  const fetchInbox = useFetchInbox()
  const getBody = useGetMessageBody()
  const sendMail = useSendMail()
  const markRead = useMarkMailRead()
  const deleteMessage = useDeleteMailMessage()

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [messageBody, setMessageBody] = useState<{ text: string; html: string } | null>(null)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  const selectedAccount = accounts.find((a: any) => a.id === selectedAccountId) || accounts[0]
  const accountId = selectedAccount?.id || null

  const { data: messages = [], isLoading: loadingMessages } = useMailMessages(accountId)

  const selectedMsg = messages.find((m: any) => m.id === selectedMessageId)

  const handleAddAccount = async (data: any) => {
    await createAccount.mutateAsync(data)
    setShowAddAccount(false)
  }

  const handleRefreshInbox = () => {
    if (!accountId) return
    fetchInbox.mutate({ accountId })
  }

  const handleSelectMessage = async (msg: any) => {
    setSelectedMessageId(msg.id)
    setMessageBody(null)
    if (!msg.isRead) markRead.mutate(msg.id)
    try {
      const body = await getBody.mutateAsync(msg.id)
      setMessageBody(body)
    } catch {
      setMessageBody({ text: '(Failed to load body)', html: '' })
    }
  }

  const handleSendMail = async (data: any) => {
    await sendMail.mutateAsync(data)
    setShowCompose(false)
  }

  const handleDeleteMsg = (id: string) => {
    deleteMessage.mutate(id)
    if (selectedMessageId === id) {
      setSelectedMessageId(null)
      setMessageBody(null)
    }
  }

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
  }

  return (
    <div className="h-full flex">
      {/* Folder sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-white/10 flex flex-col bg-black/10">
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm font-medium">Mail</span>
            <button onClick={() => setShowAddAccount(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Accounts */}
        <div className="flex-1 overflow-auto py-1">
          <p className="px-3 text-white/30 text-[10px] uppercase tracking-wide mb-1">Accounts</p>
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 text-white/30 animate-spin" /></div>
          ) : accounts.length === 0 ? (
            <div className="px-3 text-white/30 text-xs py-2">
              <p className="mb-2">No accounts</p>
              <button onClick={() => setShowAddAccount(true)} className="text-desktop-accent text-xs hover:underline">+ Add account</button>
            </div>
          ) : (
            accounts.map((acc: any) => (
              <div key={acc.id}
                onClick={() => { setSelectedAccountId(acc.id); setSelectedMessageId(null); setMessageBody(null) }}
                className={`px-3 py-2 cursor-pointer transition-colors group ${accountId === acc.id ? 'bg-desktop-accent/15' : 'hover:bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-white/70 truncate">{acc.name || acc.email}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteAccount.mutate(acc.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5 pl-5 truncate">{acc.email}</p>
              </div>
            ))
          )}

          {accountId && (
            <>
              <p className="px-3 mt-3 text-white/30 text-[10px] uppercase tracking-wide mb-1">Folders</p>
              <div className={`px-3 py-1.5 flex items-center gap-2 cursor-pointer bg-desktop-accent/10 text-white/80`}>
                <Inbox className="w-3.5 h-3.5" /> <span className="text-xs">Inbox</span>
                <span className="ml-auto text-[10px] text-white/40">{messages.length}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {accountId && (
          <div className="p-2 border-t border-white/10 space-y-1">
            <button onClick={() => setShowCompose(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-desktop-accent/20 hover:bg-desktop-accent/30 rounded-lg text-desktop-accent text-xs transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Compose
            </button>
            <button onClick={handleRefreshInbox} disabled={fetchInbox.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-xs transition-colors disabled:opacity-50">
              {fetchInbox.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
            </button>
          </div>
        )}
      </div>

      {/* Message list */}
      <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col">
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-white/60 text-xs font-medium">
            {accountId ? `Inbox (${messages.length})` : 'Select an account'}
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center text-white/30 text-xs py-8">
              {accountId ? 'No messages. Click Refresh to fetch.' : 'Select an account to view messages.'}
            </div>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`px-3 py-2.5 border-b border-white/5 cursor-pointer group transition-colors ${
                  selectedMessageId === msg.id ? 'bg-desktop-accent/15' : 'hover:bg-white/5'
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs truncate ${msg.isRead ? 'text-white/50' : 'text-white font-medium'}`}>
                    {msg.fromName || msg.fromAddr || 'Unknown'}
                  </span>
                  <span className="text-[10px] text-white/30 flex-shrink-0">{formatDate(msg.date)}</span>
                </div>
                <p className={`text-xs mt-0.5 truncate ${msg.isRead ? 'text-white/40' : 'text-white/70'}`}>{msg.subject || '(no subject)'}</p>
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); handleDeleteMsg(msg.id) }}
                    className="p-0.5 hover:bg-red-500/20 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedMsg ? (
          <>
            <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
              <h3 className="text-white text-sm font-medium">{selectedMsg.subject || '(no subject)'}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-white/50 text-xs">
                <span>From: <span className="text-white/70">{selectedMsg.fromAddr}</span></span>
                <span>To: <span className="text-white/70">{selectedMsg.toAddr}</span></span>
                <span>{formatDate(selectedMsg.date)}</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {getBody.isPending ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
              ) : messageBody?.html ? (
                <div className="bg-white rounded-lg p-4" dangerouslySetInnerHTML={{ __html: messageBody.html }} />
              ) : messageBody?.text ? (
                <pre className="text-white/70 text-xs font-mono whitespace-pre-wrap">{messageBody.text}</pre>
              ) : (
                <p className="text-white/30 text-xs">Loading message body...</p>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/20">
            <Mail className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select a message to read</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddAccount && (
        <AddAccountModal onClose={() => setShowAddAccount(false)} onSave={handleAddAccount} saving={createAccount.isPending} />
      )}
      {showCompose && accountId && (
        <ComposeModal accountId={accountId} onClose={() => setShowCompose(false)} onSend={handleSendMail} sending={sendMail.isPending} />
      )}
    </div>
  )
}
