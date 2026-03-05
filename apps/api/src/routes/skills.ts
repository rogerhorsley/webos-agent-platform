import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { streamChat } from '../services/claude'

export async function skillRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    return dbGetAll('skills', undefined, undefined, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    }).map(s => ({
      ...s,
      installed: s.installed === 1 || s.installed === true,
    }))
  })

  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const skill = dbGetOne('skills', slug, 'slug')
    if (!skill) return reply.status(404).send({ error: 'Skill not found' })
    return { ...skill, installed: skill.installed === 1 || skill.installed === true }
  })

  fastify.post('/:slug/install', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const skill = dbGetOne<any>('skills', slug, 'slug')
    if (!skill) return reply.status(404).send({ error: 'Skill not found' })
    dbUpdate('skills', skill.id, { installed: 1, updatedAt: new Date().toISOString() })
    return { message: `Skill ${slug} installed successfully` }
  })

  fastify.delete('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const skill = dbGetOne<any>('skills', slug, 'slug')
    if (!skill || !(skill.installed === 1 || skill.installed === true)) {
      return reply.status(404).send({ error: 'Skill not installed' })
    }
    dbUpdate('skills', skill.id, { installed: 0, updatedAt: new Date().toISOString() })
    return reply.status(204).send()
  })

  // ── Skill Chains ────────────────────────────────────────────────────

  const ChainSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    skillIds: z.array(z.string()).min(1),
    config: z.record(z.any()).optional(),
  })

  fastify.get('/chains', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    return dbGetAll('skill_chains', undefined, undefined, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  })

  fastify.post('/chains', async (request, reply) => {
    const body = ChainSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('skill_chains', { id, ...body, createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('skill_chains', id))
  })

  fastify.delete('/chains/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('skill_chains', id)) return reply.status(404).send({ error: 'Chain not found' })
    dbDelete('skill_chains', id)
    return reply.status(204).send()
  })

  fastify.post('/chains/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string }
    const chain = dbGetOne<any>('skill_chains', id)
    if (!chain) return reply.status(404).send({ error: 'Chain not found' })

    const { input } = (request.body as any) || {}
    if (!input) return reply.status(400).send({ error: 'input is required' })

    const results: Array<{ skillId: string; skillName: string; output: string }> = []
    let workingInput = input

    for (const skillId of (chain.skillIds || [])) {
      const skill = dbGetOne<any>('skills', skillId)
      if (!skill) {
        results.push({ skillId, skillName: 'unknown', output: `Skill ${skillId} not found` })
        continue
      }

      const systemPrompt = skill.content?.systemPrompt || `You are a ${skill.name} specialist.`
      const instructions = skill.content?.instructions || ''
      const prompt = [instructions, `Input:\n${workingInput}`].filter(Boolean).join('\n\n')

      const output = await streamChat(
        [{ role: 'user', content: prompt }],
        systemPrompt
      )

      results.push({ skillId: skill.id, skillName: skill.name, output })
      workingInput = output
    }

    return {
      chainId: id,
      chainName: chain.name,
      results,
      finalOutput: workingInput,
    }
  })
}
