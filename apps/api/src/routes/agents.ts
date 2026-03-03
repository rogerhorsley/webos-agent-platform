import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const AgentSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['developer', 'designer', 'researcher', 'custom']),
  systemPrompt: z.string().optional(),
  config: z.object({
    model: z.string().default('claude-sonnet-4-5'),
    temperature: z.number().min(0).max(1).default(0.7),
    maxTokens: z.number().default(4096),
  }).optional(),
})

// In-memory store (replace with database)
const agents: Map<string, any> = new Map()

export async function agentRoutes(fastify: FastifyInstance) {
  // List agents
  fastify.get('/', async () => {
    return Array.from(agents.values())
  })

  // Get agent
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const agent = agents.get(id)
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' })
    }
    return agent
  })

  // Create agent
  fastify.post('/', async (request, reply) => {
    const body = AgentSchema.parse(request.body)
    const id = crypto.randomUUID()
    const agent = {
      id,
      ...body,
      status: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    agents.set(id, agent)
    return reply.status(201).send(agent)
  })

  // Update agent
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = agents.get(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Agent not found' })
    }
    const body = AgentSchema.partial().parse(request.body)
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    agents.set(id, updated)
    return updated
  })

  // Delete agent
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!agents.has(id)) {
      return reply.status(404).send({ error: 'Agent not found' })
    }
    agents.delete(id)
    return reply.status(204).send()
  })
}
