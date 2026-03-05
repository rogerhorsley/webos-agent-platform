import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbDelete, dbExists } from '../db/index'

const MCPServerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  transport: z.enum(['stdio', 'sse', 'websocket']),
  command: z.string().optional(),
  url: z.string().optional(),
  env: z.record(z.string()).optional(),
})

export async function mcpRoutes(fastify: FastifyInstance) {
  fastify.get('/servers', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    return dbGetAll('mcp_servers', undefined, undefined, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  })

  fastify.post('/servers', async (request, reply) => {
    const body = MCPServerSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('mcp_servers', {
      id,
      ...body,
      tools: [],
      resources: [],
      prompts: [],
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    })
    return reply.status(201).send(dbGetOne('mcp_servers', id))
  })

  fastify.get('/servers/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const server = dbGetOne('mcp_servers', id)
    if (!server) return reply.status(404).send({ error: 'MCP server not found' })
    return server
  })

  fastify.delete('/servers/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('mcp_servers', id)) return reply.status(404).send({ error: 'MCP server not found' })
    dbDelete('mcp_servers', id)
    return reply.status(204).send()
  })

  fastify.post('/tools/:name/call', async (request) => {
    const { name } = request.params as { name: string }
    const { args } = request.body as { args: any }
    return {
      tool: name,
      result: `Tool ${name} called with args: ${JSON.stringify(args)}`,
      timestamp: new Date().toISOString(),
    }
  })
}
