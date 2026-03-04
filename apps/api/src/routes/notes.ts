import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'

const NoteSchema = z.object({
  title: z.string().min(1),
  content: z.any().optional(),
  agentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function noteRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request) => {
    const { agentId } = request.query as { agentId?: string }
    if (agentId) return dbGetAll('notes', 'agentId = ?', [agentId])
    return dbGetAll('notes')
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const note = dbGetOne('notes', id)
    if (!note) return reply.status(404).send({ error: 'Note not found' })
    return note
  })

  fastify.post('/', async (request, reply) => {
    const body = NoteSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('notes', { id, ...body, createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('notes', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('notes', id)) return reply.status(404).send({ error: 'Note not found' })
    const body = NoteSchema.partial().parse(request.body)
    dbUpdate('notes', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('notes', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('notes', id)) return reply.status(404).send({ error: 'Note not found' })
    dbDelete('notes', id)
    return reply.status(204).send()
  })
}
