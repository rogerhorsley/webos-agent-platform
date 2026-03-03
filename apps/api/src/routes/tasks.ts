import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const TaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['chat', 'workflow', 'batch']),
  agentId: z.string().optional(),
  teamId: z.string().optional(),
  input: z.object({
    prompt: z.string(),
    context: z.any().optional(),
  }),
})

// In-memory store
const tasks: Map<string, any> = new Map()

export async function taskRoutes(fastify: FastifyInstance) {
  // List tasks
  fastify.get('/', async (request) => {
    const { status } = request.query as { status?: string }
    let result = Array.from(tasks.values())
    if (status) {
      result = result.filter(t => t.status === status)
    }
    return result
  })

  // Get task
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = tasks.get(id)
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' })
    }
    return task
  })

  // Create task
  fastify.post('/', async (request, reply) => {
    const body = TaskSchema.parse(request.body)
    const id = crypto.randomUUID()
    const task = {
      id,
      ...body,
      status: 'pending',
      progress: { current: 0, total: 100 },
      createdAt: new Date().toISOString(),
    }
    tasks.set(id, task)
    return reply.status(201).send(task)
  })

  // Start task
  fastify.post('/:id/start', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = tasks.get(id)
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' })
    }
    task.status = 'running'
    task.startedAt = new Date().toISOString()
    tasks.set(id, task)

    // TODO: Actually start the task execution
    // This would involve queuing the task with BullMQ

    return task
  })

  // Cancel task
  fastify.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = tasks.get(id)
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' })
    }
    task.status = 'cancelled'
    tasks.set(id, task)
    return task
  })

  // Delete task
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!tasks.has(id)) {
      return reply.status(404).send({ error: 'Task not found' })
    }
    tasks.delete(id)
    return reply.status(204).send()
  })
}
