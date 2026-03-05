import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { streamChat, type ChatMessage } from '../services/claude'
import { dbGetOne } from '../db/index'

const sessionHistory = new Map<string, ChatMessage[]>()

const ChatMessageSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
  agentId: z.string().optional(),
  model: z.string().optional(),
})

export async function chatRoutes(fastify: FastifyInstance) {
  // POST /api/chat/message - send a message and get streaming response via SSE
  fastify.post('/message', async (request, reply) => {
    const body = ChatMessageSchema.parse(request.body)
    const { sessionId, message, agentId, model } = body

    // Get agent system prompt if specified
    let systemPrompt: string | undefined
    let agentModel: string | undefined
    if (agentId) {
      const agent = dbGetOne<{ systemPrompt?: string; config?: { model?: string } }>('agents', agentId)
      if (agent) {
        systemPrompt = agent.systemPrompt
        agentModel = agent.config?.model
      }
    }

    // Get or create session history
    if (!sessionHistory.has(sessionId)) {
      sessionHistory.set(sessionId, [])
    }
    const history = sessionHistory.get(sessionId)!

    // Add user message
    history.push({ role: 'user', content: message })

    // Set up SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    let fullResponse = ''

    try {
      await streamChat(
        history,
        systemPrompt,
        model || agentModel,
        {
          onToken: (token) => {
            fullResponse += token
            reply.raw.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`)
          },
          onDone: (text) => {
            reply.raw.write(`data: ${JSON.stringify({ type: 'done', content: text })}\n\n`)
            reply.raw.end()
          },
          onError: (error) => {
            reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
            reply.raw.end()
          },
          onToolUse: (toolUse) => {
            reply.raw.write(`data: ${JSON.stringify(toolUse)}\n\n`)
          },
        }
      )

      // Add assistant response to history
      if (fullResponse) {
        history.push({ role: 'assistant', content: fullResponse })
      }

      // Trim history to last 50 messages
      if (history.length > 50) {
        const trimmed = history.slice(-50)
        sessionHistory.set(sessionId, trimmed)
      }
    } catch (err: unknown) {
      const error = err as Error
      if (!reply.raw.writableEnded) {
        reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
        reply.raw.end()
      }
    }
  })

  // GET /api/chat/sessions/:sessionId - get session history
  fastify.get('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    const history = sessionHistory.get(sessionId) || []
    return { sessionId, messages: history }
  })

  // DELETE /api/chat/sessions/:sessionId - clear session
  fastify.delete('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    sessionHistory.delete(sessionId)
    return reply.status(204).send()
  })
}
