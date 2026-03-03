import { FastifyInstance } from 'fastify'

// Mock skills data
const skills = [
  {
    id: '1',
    slug: 'web-search',
    name: 'Web Search',
    version: '1.0.0',
    description: 'Search the web for information',
    category: 'research',
    author: 'system',
  },
  {
    id: '2',
    slug: 'code-review',
    name: 'Code Review',
    version: '1.0.0',
    description: 'Review code for best practices',
    category: 'development',
    author: 'system',
  },
  {
    id: '3',
    slug: 'document-writer',
    name: 'Document Writer',
    version: '1.0.0',
    description: 'Create professional documents',
    category: 'writing',
    author: 'system',
  },
]

const installedSkills: Set<string> = new Set()

export async function skillRoutes(fastify: FastifyInstance) {
  // List available skills
  fastify.get('/', async () => {
    return skills.map(skill => ({
      ...skill,
      installed: installedSkills.has(skill.slug),
    }))
  })

  // Get skill details
  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const skill = skills.find(s => s.slug === slug)
    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' })
    }
    return {
      ...skill,
      installed: installedSkills.has(skill.slug),
    }
  })

  // Install skill
  fastify.post('/:slug/install', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const skill = skills.find(s => s.slug === slug)
    if (!skill) {
      return reply.status(404).send({ error: 'Skill not found' })
    }
    installedSkills.add(slug)
    return { message: `Skill ${slug} installed successfully` }
  })

  // Uninstall skill
  fastify.delete('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    if (!installedSkills.has(slug)) {
      return reply.status(404).send({ error: 'Skill not installed' })
    }
    installedSkills.delete(slug)
    return reply.status(204).send()
  })
}
