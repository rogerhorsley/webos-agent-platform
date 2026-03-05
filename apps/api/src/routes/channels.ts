import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { startChannel, stopChannel, sendToChannel, getChannelStats } from '../services/channelManager'

const ChannelSchema = z.object({
  type: z.enum(['telegram', 'feishu', 'slack', 'discord']),
  name: z.string().min(1),
  config: z.record(z.any()).default({}),
  agentId: z.string().optional(),
  teamId: z.string().optional(),
})

const SendSchema = z.object({
  chatId: z.string().min(1),
  text: z.string().min(1),
})

export async function channelRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    const channels = dbGetAll('channels', undefined, undefined, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
    return channels.map((ch: any) => ({
      ...ch,
      config: { ...ch.config, botToken: ch.config?.botToken ? '***' : undefined, appSecret: ch.config?.appSecret ? '***' : undefined },
    }))
  })

  fastify.get('/stats', async () => {
    return getChannelStats()
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const ch = dbGetOne('channels', id)
    if (!ch) return reply.status(404).send({ error: 'Channel not found' })
    return ch
  })

  fastify.post('/', async (request, reply) => {
    const body = ChannelSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('channels', { id, ...body, status: 'disconnected', createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('channels', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('channels', id)) return reply.status(404).send({ error: 'Channel not found' })
    const body = ChannelSchema.partial().parse(request.body)
    dbUpdate('channels', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('channels', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('channels', id)) return reply.status(404).send({ error: 'Channel not found' })
    try { await stopChannel(id) } catch {}
    dbDelete('channels', id)
    return reply.status(204).send()
  })

  fastify.post('/:id/connect', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('channels', id)) return reply.status(404).send({ error: 'Channel not found' })
    await startChannel(id)
    return dbGetOne('channels', id)
  })

  fastify.post('/:id/disconnect', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('channels', id)) return reply.status(404).send({ error: 'Channel not found' })
    await stopChannel(id)
    return dbGetOne('channels', id)
  })

  fastify.post('/:id/send', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('channels', id)) return reply.status(404).send({ error: 'Channel not found' })
    const { chatId, text } = SendSchema.parse(request.body)
    await sendToChannel(id, chatId, text)
    return { ok: true }
  })

  fastify.get('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('channels', id)) return reply.status(404).send({ error: 'Channel not found' })
    const { chatId, limit } = request.query as { chatId?: string; limit?: string }
    let where = 'channelId = ?'
    const params: any[] = [id]
    if (chatId) { where += ' AND chatId = ?'; params.push(chatId) }
    const messages = dbGetAll('channel_messages', where, params)
    return messages.slice(0, parseInt(limit || '100'))
  })
}
