import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { computeNextRun } from '../services/taskScheduler'

const ScheduledTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  agentId: z.string().optional(),
  teamId: z.string().optional(),
  channelId: z.string().optional(),
  chatId: z.string().optional(),
  prompt: z.string().min(1),
  scheduleType: z.enum(['cron', 'interval', 'once']),
  scheduleValue: z.string().min(1),
})

export async function scheduledTaskRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return dbGetAll('scheduled_tasks')
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = dbGetOne('scheduled_tasks', id)
    if (!task) return reply.status(404).send({ error: 'Scheduled task not found' })
    return task
  })

  fastify.post('/', async (request, reply) => {
    const body = ScheduledTaskSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const nextRun = computeNextRun(body.scheduleType, body.scheduleValue)

    dbInsert('scheduled_tasks', {
      id,
      ...body,
      status: 'active',
      nextRun,
      lastRun: null,
      lastResult: null,
      createdAt: now,
      updatedAt: now,
    })
    return reply.status(201).send(dbGetOne('scheduled_tasks', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('scheduled_tasks', id)) return reply.status(404).send({ error: 'Not found' })
    const body = ScheduledTaskSchema.partial().parse(request.body)
    const updates: any = { ...body, updatedAt: new Date().toISOString() }
    if (body.scheduleType && body.scheduleValue) {
      updates.nextRun = computeNextRun(body.scheduleType, body.scheduleValue)
    }
    dbUpdate('scheduled_tasks', id, updates)
    return dbGetOne('scheduled_tasks', id)
  })

  fastify.post('/:id/pause', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('scheduled_tasks', id)) return reply.status(404).send({ error: 'Not found' })
    dbUpdate('scheduled_tasks', id, { status: 'paused', updatedAt: new Date().toISOString() })
    return dbGetOne('scheduled_tasks', id)
  })

  fastify.post('/:id/resume', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = dbGetOne<any>('scheduled_tasks', id)
    if (!task) return reply.status(404).send({ error: 'Not found' })
    const nextRun = computeNextRun(task.scheduleType, task.scheduleValue)
    dbUpdate('scheduled_tasks', id, { status: 'active', nextRun, updatedAt: new Date().toISOString() })
    return dbGetOne('scheduled_tasks', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('scheduled_tasks', id)) return reply.status(404).send({ error: 'Not found' })
    dbDelete('scheduled_tasks', id)
    return reply.status(204).send()
  })
}
