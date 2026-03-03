import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const WorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  variables: z.record(z.any()).optional(),
})

// In-memory store
const workflows: Map<string, any> = new Map()

export async function workflowRoutes(fastify: FastifyInstance) {
  // List workflows
  fastify.get('/', async () => {
    return Array.from(workflows.values())
  })

  // Get workflow
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const workflow = workflows.get(id)
    if (!workflow) {
      return reply.status(404).send({ error: 'Workflow not found' })
    }
    return workflow
  })

  // Create workflow
  fastify.post('/', async (request, reply) => {
    const body = WorkflowSchema.parse(request.body)
    const id = crypto.randomUUID()
    const workflow = {
      id,
      ...body,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    workflows.set(id, workflow)
    return reply.status(201).send(workflow)
  })

  // Update workflow
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = workflows.get(id)
    if (!existing) {
      return reply.status(404).send({ error: 'Workflow not found' })
    }
    const body = WorkflowSchema.partial().parse(request.body)
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    workflows.set(id, updated)
    return updated
  })

  // Delete workflow
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!workflows.has(id)) {
      return reply.status(404).send({ error: 'Workflow not found' })
    }
    workflows.delete(id)
    return reply.status(204).send()
  })

  // Run workflow
  fastify.post('/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string }
    const workflow = workflows.get(id)
    if (!workflow) {
      return reply.status(404).send({ error: 'Workflow not found' })
    }

    // TODO: Implement workflow execution engine
    const runId = crypto.randomUUID()
    return {
      runId,
      workflowId: id,
      status: 'started',
      startedAt: new Date().toISOString(),
    }
  })
}
