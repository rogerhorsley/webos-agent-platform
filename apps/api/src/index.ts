import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
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
import { chatRoutes as restChatRoutes } from './routes/chat'
import { ensureWorkspacesRoot } from './services/workspace'
import { startWorker, setSocketIO, getQueueStats, closeQueue } from './services/taskQueue'
import { teamRoutes } from './routes/teams'
import { sandboxRoutes } from './routes/sandbox'
import { handleNexusCoreChat, NEXUS_CORE_ID } from './services/nexusCore'
import { setMessageBusIO } from './services/messageBus'
import { channelRoutes } from './routes/channels'
import { scheduledTaskRoutes } from './routes/scheduledTasks'
import { chatRoutes as chatSessionRoutes } from './routes/chats'
import './channels/index'
import { setChannelManagerIO, restoreChannels } from './services/channelManager'
import { startScheduler, setSchedulerIO } from './services/taskScheduler'
import { startAutonomyLoop, setAutonomyIO } from './services/agentAutonomy'
import { noteRoutes } from './routes/notes'
import { browserRoutes } from './routes/browser'
import { mailRoutes } from './routes/mail'
import { dbHealthCheck } from './db/index'
import IORedis from 'ioredis'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const HOST = process.env.HOST || '0.0.0.0'
const API_KEY = process.env.API_KEY || ''
const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = process.env.REDIS_PORT || '6379'
const REDIS_URL = process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`

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

  // Rate limiting (global: 60 req/min per IP)
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
  })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500
    const isProduction = process.env.NODE_ENV === 'production'

    fastify.log.error({
      err: error,
      method: request.method,
      url: request.url,
      statusCode,
    })

    reply.status(statusCode).send({
      error: isProduction && statusCode >= 500 ? 'Internal Server Error' : error.message,
      statusCode,
    })
  })

  // API key authentication hook for /api/* routes
  if (API_KEY) {
    fastify.addHook('preHandler', async (request, reply) => {
      if (!request.url.startsWith('/api')) return
      const authHeader = request.headers.authorization
      if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return reply.status(401).send({ error: 'Unauthorized: invalid or missing API key' })
      }
    })
  }

  // Socket.IO
  const io = new Server(fastify.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    fastify.log.info(`Client connected: ${socket.id}`)

    // One AbortController per active chat stream on this socket
    let activeAbort: AbortController | null = null

    socket.on('chat:message', async (data: {
      agentId?: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      systemPrompt?: string
      model?: string
      dispatchMode?: 'auto' | 'confirm'
    }) => {
      if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
        socket.emit('chat:error', { error: 'Invalid chat:message payload — messages array required' })
        return
      }

      activeAbort?.abort()
      activeAbort = new AbortController()
      const { signal } = activeAbort
      const targetAgentId = data.agentId || NEXUS_CORE_ID

      try {
        if (targetAgentId === NEXUS_CORE_ID) {
          const { content, dispatch } = await handleNexusCoreChat({
            messages: data.messages,
            model: data.model,
            dispatchMode: data.dispatchMode || 'auto',
            callbacks: {
              onToken: (token) => {
                socket.emit('chat:token', { agentId: targetAgentId, token })
              },
              onDone: () => {},
              onError: (err) => {
                socket.emit('chat:error', { agentId: targetAgentId, error: err.message })
              },
            },
            signal,
          })
          activeAbort = null
          socket.emit('chat:done', {
            agentId: targetAgentId,
            content,
            dispatch,
          })
        } else {
          await streamChat(
            data.messages,
            data.systemPrompt,
            data.model,
            {
              onToken: (token) => {
                socket.emit('chat:token', { agentId: targetAgentId, token })
              },
              onDone: (fullText) => {
                activeAbort = null
                socket.emit('chat:done', { agentId: targetAgentId, content: fullText })
              },
              onError: (err) => {
                activeAbort = null
                socket.emit('chat:error', { agentId: targetAgentId, error: err.message })
              },
              onToolUse: (toolUse) => {
                socket.emit('chat:tool_use', { agentId: targetAgentId, ...toolUse })
              },
            },
            signal
          )
        }
      } catch (err: any) {
        if (!signal.aborted) {
          socket.emit('chat:error', { agentId: targetAgentId, error: err.message })
        }
        activeAbort = null
      }
    })

    socket.on('chat:stop', () => {
      if (activeAbort) {
        activeAbort.abort()
        activeAbort = null
        socket.emit('chat:stopped')
      }
    })

    socket.on('task:subscribe', (data) => {
      socket.join(`task:${data.taskId}`)
    })

    socket.on('team:subscribe', (data) => {
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

  // Start task worker + subsystems
  setSocketIO(io)
  setMessageBusIO(io)
  setChannelManagerIO(io)
  setSchedulerIO(io)
  setAutonomyIO(io)
  try {
    startWorker()
  } catch (err) {
    fastify.log.warn(`Task worker failed to start (Redis may be unavailable): ${String(err)}`)
  }

  // Health check
  fastify.get('/health', async () => {
    let queueStats = null
    try { queueStats = await getQueueStats() } catch {}
    return { status: 'ok', timestamp: new Date().toISOString(), queue: queueStats }
  })

  // Liveness probe — lightweight "am I up?"
  fastify.get('/health/live', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Readiness probe — check SQLite + Redis
  fastify.get('/health/ready', async (_request, reply) => {
    const checks: Record<string, boolean> = {}

    checks.sqlite = dbHealthCheck()

    try {
      const redis = new IORedis(REDIS_URL, { lazyConnect: true, connectTimeout: 2000 })
      await redis.connect()
      await redis.ping()
      checks.redis = true
      await redis.quit()
    } catch {
      checks.redis = false
    }

    const allReady = Object.values(checks).every(Boolean)
    const statusCode = allReady ? 200 : 503
    return reply.status(statusCode).send({
      status: allReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    })
  })

  // API routes
  fastify.register(agentRoutes, { prefix: '/api/agents' })
  fastify.register(taskRoutes, { prefix: '/api/tasks' })
  fastify.register(mcpRoutes, { prefix: '/api/mcp' })
  fastify.register(skillRoutes, { prefix: '/api/skills' })
  fastify.register(promptRoutes, { prefix: '/api/prompts' })
  fastify.register(workflowRoutes, { prefix: '/api/workflows' })
  fastify.register(teamRoutes, { prefix: '/api/teams' })
  fastify.register(sandboxRoutes, { prefix: '/api/sandbox' })
  fastify.register(channelRoutes, { prefix: '/api/channels' })
  fastify.register(scheduledTaskRoutes, { prefix: '/api/scheduled-tasks' })
  fastify.register(workspaceRoutes, { prefix: '/api/workspaces' })
  fastify.register(noteRoutes, { prefix: '/api/notes' })
  fastify.register(browserRoutes, { prefix: '/api/browser' })
  fastify.register(mailRoutes, { prefix: '/api/mail' })
  fastify.register(restChatRoutes, { prefix: '/api/chat' })
  fastify.register(chatSessionRoutes, { prefix: '/api/chats' })

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

    // Start subsystems after server is listening
    restoreChannels().catch(err => fastify.log.warn(`Channel restore failed: ${err}`))
    startScheduler()
    startAutonomyLoop()

    if (isProduction && existsSync(webDistPath)) {
      fastify.log.info(`Frontend available at http://${HOST}:${PORT}`)
    }
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
