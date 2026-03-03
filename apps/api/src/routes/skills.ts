import { FastifyInstance } from 'fastify'
import { dbGetAll, dbGetOne, dbUpdate, dbExists } from '../db/index'

export async function skillRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return dbGetAll('skills').map(s => ({
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
}
