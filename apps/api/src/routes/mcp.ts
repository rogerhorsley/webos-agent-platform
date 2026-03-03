import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const MCPServerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  transport: z.enum(['stdio', 'sse', 'websocket']),
  command: z.string().optional(),
  url: z.string().optional(),
  env: z.record(z.string()).optional(),
})

// In-memory store
const mcpServers: Map<string, any> = new Map()

export async function mcpRoutes(fastify: FastifyInstance) {
  // List MCP servers
  fastify.get('/servers', async () => {
    return Array.from(mcpServers.values())
  })

  // Register MCP server
  fastify.post('/servers', async (request, reply) => {
    const body = MCPServerSchema.parse(request.body)
    const id = crypto.randomUUID()
    const server = {
      id,
      ...body,
      tools: [],
      resources: [],
      prompts: [],
      status: 'inactive',
      createdAt: new Date().toISOString(),
    }
    mcpServers.set(id, server)
    return reply.status(201).send(server)
  })

  // Get MCP server
  fastify.get('/servers/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const server = mcpServers.get(id)
    if (!server) {
      return reply.status(404).send({ error: 'MCP server not found' })
    }
    return server
  })

  // Delete MCP server
  fastify.delete('/servers/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!mcpServers.has(id)) {
      return reply.status(404).send({ error: 'MCP server not found' })
    }
    mcpServers.delete(id)
    return reply.status(204).send()
  })

  // Call MCP tool
  fastify.post('/tools/:name/call', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { args } = request.body as { args: any }

    // TODO: Implement actual MCP tool calling
    return {
      tool: name,
      result: `Tool ${name} called with args: ${JSON.stringify(args)}`,
      timestamp: new Date().toISOString(),
    }
  })
}
