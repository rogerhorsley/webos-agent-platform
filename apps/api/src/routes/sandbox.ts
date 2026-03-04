import { FastifyInstance } from 'fastify'
import {
  isDockerAvailable,
  ensureImage,
  getContainerInfo,
  createContainer,
  startContainer,
  stopContainer,
  removeContainer,
  restartContainer,
  execInContainer,
  listManagedContainers,
  getSandboxConfig,
} from '../services/containerManager'

export async function sandboxRoutes(fastify: FastifyInstance) {
  fastify.get('/status', async () => {
    const available = await isDockerAvailable()
    const hasImage = available ? await ensureImage() : false
    return {
      available,
      hasImage,
      config: getSandboxConfig(),
    }
  })

  fastify.get('/containers', async () => {
    return listManagedContainers()
  })

  fastify.get('/containers/:agentId', async (request) => {
    const { agentId } = request.params as { agentId: string }
    return getContainerInfo(agentId)
  })

  fastify.post('/containers/:agentId/start', async (request) => {
    const { agentId } = request.params as { agentId: string }
    return createContainer(agentId)
  })

  fastify.post('/containers/:agentId/stop', async (request) => {
    const { agentId } = request.params as { agentId: string }
    return stopContainer(agentId)
  })

  fastify.post('/containers/:agentId/restart', async (request) => {
    const { agentId } = request.params as { agentId: string }
    return restartContainer(agentId)
  })

  fastify.delete('/containers/:agentId', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    await removeContainer(agentId)
    return reply.status(204).send()
  })

  fastify.post('/containers/:agentId/exec', async (request) => {
    const { agentId } = request.params as { agentId: string }
    const { command, timeout } = request.body as { command: string; timeout?: number }
    if (!command) throw new Error('command is required')
    return execInContainer(agentId, command, { timeout })
  })
}
