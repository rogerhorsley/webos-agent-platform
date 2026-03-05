import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'

const SessionSchema = z.object({
  title: z.string().default('New Chat'),
  agentId: z.string().optional(),
  model: z.string().optional(),
})

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  attachments: z.array(z.any()).optional(),
  dispatch: z.any().optional(),
})

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    return dbGetAll('chat_sessions', undefined, undefined, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const session = dbGetOne('chat_sessions', id)
    if (!session) return reply.status(404).send({ error: 'Chat session not found' })
    return session
  })

  fastify.post('/', async (request, reply) => {
    const body = SessionSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('chat_sessions', { id, ...body, createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('chat_sessions', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('chat_sessions', id)) return reply.status(404).send({ error: 'Chat session not found' })
    const body = SessionSchema.partial().parse(request.body)
    dbUpdate('chat_sessions', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('chat_sessions', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('chat_sessions', id)) return reply.status(404).send({ error: 'Chat session not found' })
    dbDelete('chat_sessions', id)
    return reply.status(204).send()
  })

  fastify.get('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('chat_sessions', id)) return reply.status(404).send({ error: 'Chat session not found' })
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    return dbGetAll('chat_messages', 'sessionId = ?', [id], {
      limit: limit ? parseInt(limit) : 200,
      offset: offset ? parseInt(offset) : undefined,
    })
  })

  fastify.post('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string }
    const session = dbGetOne<any>('chat_sessions', id)
    if (!session) return reply.status(404).send({ error: 'Chat session not found' })
    const body = MessageSchema.parse(request.body)
    const msgId = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('chat_messages', {
      id: msgId,
      sessionId: id,
      ...body,
      attachments: body.attachments || [],
      dispatch: body.dispatch || null,
      createdAt: now,
    })

    // Auto-set title from first user message if still default
    if (body.role === 'user' && session.title === 'New Chat') {
      dbUpdate('chat_sessions', id, { title: body.content.slice(0, 30), updatedAt: now })
    } else {
      dbUpdate('chat_sessions', id, { updatedAt: now })
    }

    return reply.status(201).send(dbGetOne('chat_messages', msgId))
  })
}
