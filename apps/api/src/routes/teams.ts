import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbCount, dbDelete, dbExists, dbGetAll, dbGetOne, dbInsert, dbUpdate } from '../db/index'
import { enqueueTask } from '../services/taskQueue'

const TeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  agentIds: z.array(z.string()).default([]),
  coordinatorId: z.string().optional(),
  communicationMode: z.enum(['sequential', 'parallel', 'hierarchical']).default('sequential'),
  sharedContext: z.boolean().default(true),
  config: z.record(z.any()).optional(),
})

const RunTeamSchema = z.object({
  name: z.string().optional(),
  prompt: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
})

function hydrateTeam(team: any) {
  const agents = (team.agentIds || [])
    .map((id: string) => dbGetOne<any>('agents', id))
    .filter(Boolean)
  return { ...team, agents }
}

export async function teamRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    const teams = dbGetAll<any>('agent_teams')
    return teams.map(hydrateTeam)
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const team = dbGetOne<any>('agent_teams', id)
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    return hydrateTeam(team)
  })

  fastify.post('/', async (request, reply) => {
    const body = TeamSchema.parse(request.body)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const team = {
      id,
      ...body,
      status: 'idle',
      createdAt: now,
      updatedAt: now,
    }
    dbInsert('agent_teams', team)
    return reply.status(201).send(hydrateTeam(dbGetOne<any>('agent_teams', id)))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('agent_teams', id)) return reply.status(404).send({ error: 'Team not found' })
    const body = TeamSchema.partial().parse(request.body)
    dbUpdate('agent_teams', id, { ...body, updatedAt: new Date().toISOString() })
    return hydrateTeam(dbGetOne<any>('agent_teams', id))
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('agent_teams', id)) return reply.status(404).send({ error: 'Team not found' })
    dbDelete('agent_teams', id)
    return reply.status(204).send()
  })

  fastify.post('/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string }
    const team = dbGetOne<any>('agent_teams', id)
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    if (!team.agentIds?.length) return reply.status(400).send({ error: 'Team has no members' })

    const body = RunTeamSchema.parse(request.body)
    const taskId = crypto.randomUUID()
    const now = new Date().toISOString()

    dbInsert('tasks', {
      id: taskId,
      name: body.name || `Team Run: ${team.name}`,
      description: `Run team ${team.name}`,
      type: 'workflow',
      status: 'queued',
      priority: body.priority,
      teamId: id,
      input: { prompt: body.prompt },
      progress: { current: 0, total: 100 },
      childTaskIds: [],
      createdAt: now,
    })

    try {
      await enqueueTask(taskId)
    } catch {
      dbUpdate('tasks', taskId, { status: 'pending' })
    }

    return {
      teamId: id,
      taskId,
      status: 'started',
      queuedTasks: dbCount('tasks', 'status = ?', ['queued']),
      startedAt: now,
    }
  })
}

