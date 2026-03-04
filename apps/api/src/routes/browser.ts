import { FastifyInstance } from 'fastify'
import * as bp from '../services/browserProxy'

export async function browserRoutes(fastify: FastifyInstance) {
  fastify.post('/session', async () => {
    const sessionId = await bp.createSession()
    return { sessionId }
  })

  fastify.post('/navigate', async (request) => {
    const { sessionId, url } = request.body as { sessionId: string; url: string }
    return bp.navigate(sessionId, url)
  })

  fastify.post('/click', async (request) => {
    const { sessionId, x, y } = request.body as { sessionId: string; x: number; y: number }
    return bp.click(sessionId, x, y)
  })

  fastify.post('/type', async (request) => {
    const { sessionId, text } = request.body as { sessionId: string; text: string }
    return bp.type(sessionId, text)
  })

  fastify.post('/key', async (request) => {
    const { sessionId, key } = request.body as { sessionId: string; key: string }
    return bp.keyPress(sessionId, key)
  })

  fastify.post('/screenshot', async (request) => {
    const { sessionId } = request.body as { sessionId: string }
    return bp.screenshot(sessionId)
  })

  fastify.post('/back', async (request) => {
    const { sessionId } = request.body as { sessionId: string }
    return bp.goBack(sessionId)
  })

  fastify.post('/forward', async (request) => {
    const { sessionId } = request.body as { sessionId: string }
    return bp.goForward(sessionId)
  })

  fastify.post('/refresh', async (request) => {
    const { sessionId } = request.body as { sessionId: string }
    return bp.refresh(sessionId)
  })

  fastify.delete('/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    await bp.closeSession(sessionId)
    return reply.status(204).send()
  })
}
