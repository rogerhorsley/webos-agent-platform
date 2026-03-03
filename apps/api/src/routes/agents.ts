import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { createWorkspace, getWorkspaceInfo } from '../services/workspace'

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

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return dbGetAll('agents')
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const agent = dbGetOne('agents', id)
    if (!agent) return reply.status(404).send({ error: 'Agent not found' })
    return agent
  })

  fastify.post('/', async (request, reply) => {
    const body = AgentSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const agent: Record<string, any> = {
      id,
      ...body,
      skills: [],
      mcpServers: [],
      status: 'idle',
      workspace: null,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const ws = await createWorkspace(id, body.name)
      agent.workspace = { path: ws.path, createdAt: ws.createdAt }
    } catch (err) {
      fastify.log.warn(`Workspace creation failed for ${id}: ${err}`)
    }

    dbInsert('agents', agent)
    return reply.status(201).send(dbGetOne('agents', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('agents', id)) return reply.status(404).send({ error: 'Agent not found' })
    const body = AgentSchema.partial().parse(request.body)
    dbUpdate('agents', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('agents', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('agents', id)) return reply.status(404).send({ error: 'Agent not found' })
    dbDelete('agents', id)
    return reply.status(204).send()
  })

  fastify.get('/:id/workspace', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('agents', id)) return reply.status(404).send({ error: 'Agent not found' })
    try {
      return await getWorkspaceInfo(id)
    } catch {
      return reply.status(404).send({ error: 'Workspace not found' })
    }
  })
}
