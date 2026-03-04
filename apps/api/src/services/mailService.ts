import { dbGetOne, dbGetAll, dbInsert, dbUpdate, dbDelete } from '../db/index'

export async function fetchInbox(accountId: string, limit = 50): Promise<any[]> {
  const account = dbGetOne<any>('mail_accounts', accountId)
  if (!account) throw new Error('Mail account not found')

  const { ImapFlow } = await import('imapflow')
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort || 993,
    secure: true,
    auth: { user: account.username, pass: account.password },
    logger: false,
  })

  await client.connect()
  const lock = await client.getMailboxLock('INBOX')

  try {
    const messages: any[] = []
    const seqRange = Math.max(1, (client as any).mailbox?.exists - limit + 1) + ':*'

    for await (const msg of client.fetch(seqRange, { envelope: true, uid: true, bodyStructure: true })) {
      const env = msg.envelope
      if (!env) continue
      const from = env.from?.[0]
      const to = env.to?.[0]
      messages.push({
        uid: msg.uid,
        subject: env.subject || '(no subject)',
        fromAddr: from ? `${from.name || ''} <${from.address}>`.trim() : '',
        fromName: from?.name || from?.address || '',
        toAddr: to ? `${to.name || ''} <${to.address}>`.trim() : '',
        date: env.date?.toISOString() || new Date().toISOString(),
        messageId: env.messageId,
      })
    }

    for (const msg of messages) {
      const existing = dbGetAll<any>('mail_messages', 'accountId = ? AND uid = ?', [accountId, msg.uid])
      if (existing.length === 0) {
        dbInsert('mail_messages', {
          id: crypto.randomUUID(),
          accountId,
          folder: 'INBOX',
          fromAddr: msg.fromAddr,
          fromName: msg.fromName,
          toAddr: msg.toAddr,
          subject: msg.subject,
          body: null,
          htmlBody: null,
          isRead: 0,
          date: msg.date,
          uid: msg.uid,
          createdAt: new Date().toISOString(),
        })
      }
    }

    return messages.reverse()
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function fetchMessageBody(accountId: string, uid: number): Promise<{ text: string; html: string }> {
  const account = dbGetOne<any>('mail_accounts', accountId)
  if (!account) throw new Error('Mail account not found')

  const { ImapFlow } = await import('imapflow')
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort || 993,
    secure: true,
    auth: { user: account.username, pass: account.password },
    logger: false,
  })

  await client.connect()
  const lock = await client.getMailboxLock('INBOX')

  try {
    const msg = await client.fetchOne(String(uid), { source: true }, { uid: true })
    const source = msg ? (msg as any).source?.toString() || '' : ''
    return { text: source, html: '' }
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function sendMail(accountId: string, to: string, subject: string, body: string): Promise<void> {
  const account = dbGetOne<any>('mail_accounts', accountId)
  if (!account) throw new Error('Mail account not found')

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: account.smtpHost,
    port: account.smtpPort || 587,
    secure: account.smtpPort === 465,
    auth: { user: account.username, pass: account.password },
  })

  await transporter.sendMail({
    from: `"${account.name || account.email}" <${account.email}>`,
    to,
    subject,
    text: body,
    html: body.includes('<') ? body : undefined,
  })
}
