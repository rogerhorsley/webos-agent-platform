import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server } from 'socket.io'
import { agentRoutes } from './routes/agents'
import { taskRoutes } from './routes/tasks'
import { mcpRoutes } from './routes/mcp'
import { skillRoutes } from './routes/skills'
import { promptRoutes } from './routes/prompts'
import { workflowRoutes } from './routes/workflows'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const HOST = process.env.HOST || '0.0.0.0'

async function main() {
  const fastify = Fastify({
    logger: true,
  })

  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  })

  // Socket.IO
  const io = new Server(fastify.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    fastify.log.info(`Client connected: ${socket.id}`)

    socket.on('chat:message', async (data) => {
      // TODO: Process message with Claude Code
      socket.emit('chat:response', {
        agentId: data.agentId,
        content: 'Response placeholder',
        done: true,
      })
    })

    socket.on('task:subscribe', (data) => {
      socket.join(`task:${data.taskId}`)
    })

    socket.on('disconnect', () => {
      fastify.log.info(`Client disconnected: ${socket.id}`)
    })
  })

  // Decorate fastify with io
  fastify.decorate('io', io)

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // API routes
  fastify.register(agentRoutes, { prefix: '/api/agents' })
  fastify.register(taskRoutes, { prefix: '/api/tasks' })
  fastify.register(mcpRoutes, { prefix: '/api/mcp' })
  fastify.register(skillRoutes, { prefix: '/api/skills' })
  fastify.register(promptRoutes, { prefix: '/api/prompts' })
  fastify.register(workflowRoutes, { prefix: '/api/workflows' })

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST })
    fastify.log.info(`Server running at http://${HOST}:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
