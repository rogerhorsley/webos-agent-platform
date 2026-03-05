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
