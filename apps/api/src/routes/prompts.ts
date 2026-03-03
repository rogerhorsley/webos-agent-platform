import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'

const PromptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  template: z.object({
    system: z.string().optional(),
    user: z.string(),
  }),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean']),
    required: z.boolean().default(true),
    default: z.any().optional(),
  })).optional(),
})

export async function promptRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => dbGetAll('prompts'))

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const p = dbGetOne('prompts', id)
    if (!p) return reply.status(404).send({ error: 'Prompt not found' })
    return p
  })

  fastify.post('/', async (request, reply) => {
    const body = PromptSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('prompts', {
      id,
      ...body,
      variables: body.variables || [],
      version: '1.0.0',
      stats: { useCount: 0, avgRating: 0 },
      createdAt: now,
      updatedAt: now,
    })
    return reply.status(201).send(dbGetOne('prompts', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('prompts', id)) return reply.status(404).send({ error: 'Prompt not found' })
    const body = PromptSchema.partial().parse(request.body)
    dbUpdate('prompts', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('prompts', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('prompts', id)) return reply.status(404).send({ error: 'Prompt not found' })
    dbDelete('prompts', id)
    return reply.status(204).send()
  })

  fastify.post('/:id/render', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { variables } = request.body as { variables: Record<string, any> }
    const prompt = dbGetOne<any>('prompts', id)
    if (!prompt) return reply.status(404).send({ error: 'Prompt not found' })

    let rendered = prompt.template?.user || ''
    for (const [key, value] of Object.entries(variables || {})) {
      rendered = rendered.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value))
    }

    // Track usage
    const stats = prompt.stats || { useCount: 0, avgRating: 0 }
    dbUpdate('prompts', id, { stats: { ...stats, useCount: (stats.useCount || 0) + 1 } })

    return { rendered, system: prompt.template?.system }
  })
}
