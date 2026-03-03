import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticPlugin from '@fastify/static'
import path from 'path'
import { existsSync } from 'fs'
import { Server } from 'socket.io'
import { agentRoutes } from './routes/agents'
import { taskRoutes } from './routes/tasks'
import { mcpRoutes } from './routes/mcp'
import { skillRoutes } from './routes/skills'
import { promptRoutes } from './routes/prompts'
import { workflowRoutes } from './routes/workflows'
import { streamChat } from './services/claude'
import { setupTerminalSocket } from './routes/terminal'
import { workspaceRoutes } from './routes/workspaces'
import { ensureWorkspacesRoot } from './services/workspace'
import { startWorker, setSocketIO, getQueueStats, closeQueue } from './services/taskQueue'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const HOST = process.env.HOST || '0.0.0.0'

async function main() {
  await ensureWorkspacesRoot()

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

    socket.on('chat:message', async (data: {
      agentId?: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      systemPrompt?: string
      model?: string
    }) => {
      try {
        await streamChat(
          data.messages,
          data.systemPrompt,
          data.model,
          {
            onToken: (token) => {
              socket.emit('chat:token', { agentId: data.agentId, token })
            },
            onDone: (fullText) => {
              socket.emit('chat:done', { agentId: data.agentId, content: fullText })
            },
            onError: (err) => {
              socket.emit('chat:error', { agentId: data.agentId, error: err.message })
            },
          }
        )
      } catch (err: any) {
        socket.emit('chat:error', { agentId: data.agentId, error: err.message })
      }
    })

    socket.on('task:subscribe', (data) => {
      socket.join(`task:${data.taskId}`)
    })

    socket.on('disconnect', () => {
      fastify.log.info(`Client disconnected: ${socket.id}`)
    })
  })

  // Setup terminal namespace
  setupTerminalSocket(io)

  // Decorate fastify with io
  fastify.decorate('io', io)

  // Start task worker
  setSocketIO(io)
  try {
    startWorker()
  } catch (err) {
    fastify.log.warn('Task worker failed to start (Redis may be unavailable):', err)
  }

  // Health check
  fastify.get('/health', async () => {
    let queueStats = null
    try { queueStats = await getQueueStats() } catch {}
    return { status: 'ok', timestamp: new Date().toISOString(), queue: queueStats }
  })

  // API routes
  fastify.register(agentRoutes, { prefix: '/api/agents' })
  fastify.register(taskRoutes, { prefix: '/api/tasks' })
  fastify.register(mcpRoutes, { prefix: '/api/mcp' })
  fastify.register(skillRoutes, { prefix: '/api/skills' })
  fastify.register(promptRoutes, { prefix: '/api/prompts' })
  fastify.register(workflowRoutes, { prefix: '/api/workflows' })
  fastify.register(workspaceRoutes, { prefix: '/api/workspaces' })

  // Serve built frontend (production mode)
  const webDistPath = path.resolve(process.cwd(), '..', 'web', 'dist')
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction && existsSync(webDistPath)) {
    await fastify.register(staticPlugin, {
      root: webDistPath,
      prefix: '/',
      decorateReply: false,
    })
    // SPA fallback: serve index.html for all non-API routes
    fastify.setNotFoundHandler(async (request, reply) => {
      if (!request.url.startsWith('/api') && !request.url.startsWith('/health')) {
        return reply.sendFile('index.html', webDistPath)
      }
      return reply.status(404).send({ error: 'Not found' })
    })
    fastify.log.info(`Serving frontend from ${webDistPath}`)
  }

  // Graceful shutdown
  const shutdown = async () => {
    fastify.log.info('Shutting down...')
    await closeQueue()
    await fastify.close()
    process.exit(0)
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST })
    fastify.log.info(`Server running at http://${HOST}:${PORT}`)
    if (isProduction && existsSync(webDistPath)) {
      fastify.log.info(`Frontend available at http://${HOST}:${PORT}`)
    }
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
