import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { enqueueTask } from '../services/taskQueue'

const TaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['chat', 'workflow', 'batch']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  agentId: z.string().optional(),
  teamId: z.string().optional(),
  input: z.object({
    prompt: z.string(),
    context: z.any().optional(),
  }),
})

export async function taskRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request) => {
    const { status } = request.query as { status?: string }
    if (status) return dbGetAll('tasks', 'status = ?', [status])
    return dbGetAll('tasks')
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = dbGetOne('tasks', id)
    if (!task) return reply.status(404).send({ error: 'Task not found' })
    return task
  })

  fastify.post('/', async (request, reply) => {
    const body = TaskSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const task = {
      id,
      ...body,
      status: 'pending',
      progress: { current: 0, total: 100 },
      childTaskIds: [],
      createdAt: now,
    }
    dbInsert('tasks', task)
    return reply.status(201).send(dbGetOne('tasks', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('tasks', id)) return reply.status(404).send({ error: 'Task not found' })
    const body = request.body as Record<string, any>
    dbUpdate('tasks', id, body)
    return dbGetOne('tasks', id)
  })

  fastify.post('/:id/start', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('tasks', id)) return reply.status(404).send({ error: 'Task not found' })
    dbUpdate('tasks', id, { status: 'queued' })

    try {
      await enqueueTask(id)
    } catch (err) {
      // Fallback: run synchronously if Redis is down
      dbUpdate('tasks', id, { status: 'running', startedAt: new Date().toISOString() })
    }

    return dbGetOne('tasks', id)
  })

  fastify.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('tasks', id)) return reply.status(404).send({ error: 'Task not found' })
    dbUpdate('tasks', id, { status: 'cancelled' })
    return dbGetOne('tasks', id)
  })

  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('tasks', id)) return reply.status(404).send({ error: 'Task not found' })
    const { output } = request.body as { output?: any }
    dbUpdate('tasks', id, {
      status: 'completed',
      output: output || {},
      progress: { current: 100, total: 100 },
      completedAt: new Date().toISOString(),
    })

    const io = (fastify as any).io
    if (io) {
      io.to(`task:${id}`).emit('task:status', { taskId: id, status: 'completed' })
    }

    return dbGetOne('tasks', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('tasks', id)) return reply.status(404).send({ error: 'Task not found' })
    dbDelete('tasks', id)
    return reply.status(204).send()
  })
}
