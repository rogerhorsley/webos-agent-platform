import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { createWorkspace, getWorkspaceInfo } from '../services/workspace'

const AgentSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['developer', 'designer', 'researcher', 'coordinator', 'custom']),
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
    if (id === 'nexus-core') return reply.status(403).send({ error: 'Built-in NexusCore cannot be deleted' })
    if (!dbExists('agents', id)) return reply.status(404).send({ error: 'Agent not found' })
    dbDelete('agents', id)
    return reply.status(204).send()
  })

  // ── Agent Templates (Market) ──────────────────────────────────────────

  fastify.get('/templates', async () => {
    return dbGetAll('agent_templates')
  })

  fastify.post('/templates/:slug/install', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const template = dbGetOne<any>('agent_templates', slug, 'slug')
    if (!template) return reply.status(404).send({ error: 'Template not found' })

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const agent: Record<string, any> = {
      id,
      name: template.name,
      role: template.role,
      systemPrompt: template.systemPrompt,
      config: template.config || { model: 'anthropic/claude-sonnet-4-5', temperature: 0.7, maxTokens: 4096 },
      skills: [],
      mcpServers: [],
      status: 'idle',
      workspace: null,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const ws = await createWorkspace(id, template.name)
      agent.workspace = { path: ws.path, createdAt: ws.createdAt }
    } catch (err) {
      fastify.log.warn(`Workspace creation failed for template install ${id}: ${err}`)
    }

    dbInsert('agents', agent)
    dbUpdate('agent_templates', template.id, { downloads: (template.downloads || 0) + 1 })
    return reply.status(201).send(dbGetOne('agents', id))
  })

  // ── Workspace ───────────────────────────────────────────────────────

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
