import { FastifyInstance } from 'fastify'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete } from '../db/index'

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return dbGetAll('chat_sessions')
  })

  fastify.post('/', async (request, reply) => {
    const { agentId, title } = (request.body || {}) as { agentId?: string; title?: string }
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('chat_sessions', {
      id,
      agentId: agentId || null,
      title: title || 'New Chat',
      createdAt: now,
      updatedAt: now,
    })
    return reply.status(201).send(dbGetOne('chat_sessions', id))
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const session = dbGetOne('chat_sessions', id)
    if (!session) return reply.status(404).send({ error: 'Chat session not found' })
    return session
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    dbDelete('chat_sessions', id)
    return reply.status(204).send()
  })

  fastify.get('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbGetOne('chat_sessions', id)) return reply.status(404).send({ error: 'Chat session not found' })
    return dbGetAll('chat_messages', 'sessionId = ?', [id])
  })

  fastify.post('/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string }
    const session = dbGetOne<any>('chat_sessions', id)
    if (!session) return reply.status(404).send({ error: 'Chat session not found' })

    const { role, content } = (request.body || {}) as { role: string; content: string }
    if (!role || !content) return reply.status(400).send({ error: 'role and content are required' })

    const msgId = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('chat_messages', { id: msgId, sessionId: id, role, content, createdAt: now })

    if (role === 'user' && session.title === 'New Chat') {
      dbUpdate('chat_sessions', id, {
        title: content.slice(0, 30),
        updatedAt: now,
      })
    } else {
      dbUpdate('chat_sessions', id, { updatedAt: now })
    }

    return reply.status(201).send({ id: msgId, sessionId: id, role, content, createdAt: now })
  })
}
