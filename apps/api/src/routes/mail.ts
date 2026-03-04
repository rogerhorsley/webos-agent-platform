import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { fetchInbox, fetchMessageBody, sendMail } from '../services/mailService'

const AccountSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  imapHost: z.string().min(1),
  imapPort: z.number().default(993),
  smtpHost: z.string().min(1),
  smtpPort: z.number().default(587),
  username: z.string().min(1),
  password: z.string().min(1),
})

const SendSchema = z.object({
  to: z.string().min(1),
  subject: z.string(),
  body: z.string(),
})

export async function mailRoutes(fastify: FastifyInstance) {
  // ── Accounts ────────────────────────────────────────────────────────

  fastify.get('/accounts', async () => {
    return dbGetAll('mail_accounts')
  })

  fastify.get('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const account = dbGetOne('mail_accounts', id)
    if (!account) return reply.status(404).send({ error: 'Mail account not found' })
    return account
  })

  fastify.post('/accounts', async (request, reply) => {
    const body = AccountSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('mail_accounts', { id, ...body, status: 'active', createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('mail_accounts', id))
  })

  fastify.put('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('mail_accounts', id)) return reply.status(404).send({ error: 'Mail account not found' })
    const body = AccountSchema.partial().parse(request.body)
    dbUpdate('mail_accounts', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('mail_accounts', id)
  })

  fastify.delete('/accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('mail_accounts', id)) return reply.status(404).send({ error: 'Mail account not found' })
    dbDelete('mail_accounts', id)
    return reply.status(204).send()
  })

  // ── Messages ────────────────────────────────────────────────────────

  fastify.get('/accounts/:id/inbox', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { limit } = request.query as { limit?: string }
    if (!dbExists('mail_accounts', id)) return reply.status(404).send({ error: 'Mail account not found' })
    try {
      const messages = await fetchInbox(id, limit ? parseInt(limit) : 50)
      return messages
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  fastify.get('/accounts/:id/messages', async (request) => {
    const { id } = request.params as { id: string }
    const { folder } = request.query as { folder?: string }
    const where = folder ? 'accountId = ? AND folder = ?' : 'accountId = ?'
    const params = folder ? [id, folder] : [id]
    return dbGetAll('mail_messages', where, params)
  })

  fastify.get('/messages/:msgId/body', async (request, reply) => {
    const { msgId } = request.params as { msgId: string }
    const msg = dbGetOne<any>('mail_messages', msgId)
    if (!msg) return reply.status(404).send({ error: 'Message not found' })
    try {
      const body = await fetchMessageBody(msg.accountId, msg.uid)
      dbUpdate('mail_messages', msgId, { body: body.text, htmlBody: body.html, isRead: 1 })
      return body
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  fastify.post('/accounts/:id/send', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('mail_accounts', id)) return reply.status(404).send({ error: 'Mail account not found' })
    const body = SendSchema.parse(request.body)
    try {
      await sendMail(id, body.to, body.subject, body.body)
      return { success: true }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  fastify.put('/messages/:msgId/read', async (request, reply) => {
    const { msgId } = request.params as { msgId: string }
    if (!dbExists('mail_messages', msgId)) return reply.status(404).send({ error: 'Message not found' })
    dbUpdate('mail_messages', msgId, { isRead: 1 })
    return { success: true }
  })

  fastify.delete('/messages/:msgId', async (request, reply) => {
    const { msgId } = request.params as { msgId: string }
    if (!dbExists('mail_messages', msgId)) return reply.status(404).send({ error: 'Message not found' })
    dbDelete('mail_messages', msgId)
    return reply.status(204).send()
  })
}
