import { FastifyInstance } from 'fastify'
import { z } from 'zod'

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

// In-memory store
const prompts: Map<string, any> = new Map()

export async function promptRoutes(fastify: FastifyInstance) {
  // List prompts
  fastify.get('/', async () => {
    return Array.from(prompts.values())
  })

  // Get prompt
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const prompt = prompts.get(id)
    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }
    return prompt
  })

  // Create prompt
  fastify.post('/', async (request, reply) => {
    const body = PromptSchema.parse(request.body)
    const id = crypto.randomUUID()
    const prompt = {
      id,
      ...body,
      version: '1.0.0',
      stats: { useCount: 0, avgRating: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    prompts.set(id, prompt)
    return reply.status(201).send(prompt)
  })

  // Update prompt
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = prompts.get(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }
    const body = PromptSchema.partial().parse(request.body)
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    prompts.set(id, updated)
    return updated
  })

  // Delete prompt
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!prompts.has(id)) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }
    prompts.delete(id)
    return reply.status(204).send()
  })

  // Render prompt
  fastify.post('/:id/render', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { variables } = request.body as { variables: Record<string, any> }
    const prompt = prompts.get(id)
    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' })
    }

    // Simple variable substitution
    let rendered = prompt.template.user
    for (const [key, value] of Object.entries(variables || {})) {
      rendered = rendered.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value))
    }

    return {
      rendered,
      system: prompt.template.system,
    }
  })
}
