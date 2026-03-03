import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'

const WorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  variables: z.record(z.any()).optional(),
})

export async function workflowRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => dbGetAll('workflows'))

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const wf = dbGetOne('workflows', id)
    if (!wf) return reply.status(404).send({ error: 'Workflow not found' })
    return wf
  })

  fastify.post('/', async (request, reply) => {
    const body = WorkflowSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('workflows', { id, ...body, status: 'draft', createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('workflows', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('workflows', id)) return reply.status(404).send({ error: 'Workflow not found' })
    const body = WorkflowSchema.partial().parse(request.body)
    dbUpdate('workflows', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('workflows', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('workflows', id)) return reply.status(404).send({ error: 'Workflow not found' })
    dbDelete('workflows', id)
    return reply.status(204).send()
  })

  fastify.post('/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('workflows', id)) return reply.status(404).send({ error: 'Workflow not found' })
    return {
      runId: crypto.randomUUID(),
      workflowId: id,
      status: 'started',
      startedAt: new Date().toISOString(),
    }
  })
}
