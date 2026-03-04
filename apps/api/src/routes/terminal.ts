import { Server, Socket } from 'socket.io'
import * as pty from 'node-pty'
import os from 'os'
import { isDockerAvailable, attachToContainer, createContainer } from '../services/containerManager'
import { dbInsert } from '../db/index'
import { runClaudeTask } from '../services/sandbox'

interface TermSession {
  type: 'pty' | 'docker'
  ptyProcess?: ReturnType<typeof pty.spawn>
  dockerStream?: any
  dockerResize?: (cols: number, rows: number) => Promise<void>
  agentId?: string
}

const sessions = new Map<string, TermSession>()

export function setupTerminalSocket(io: Server) {
  const termNs = io.of('/terminal')

  termNs.on('connection', async (socket: Socket) => {
    const requestedAgent = socket.handshake.query.agentId as string | undefined
    const dockerAvailable = await isDockerAvailable().catch(() => false)
    const useDocker = dockerAvailable && process.env.SANDBOX_MODE === 'docker'

    if (useDocker && requestedAgent) {
      await connectDockerTerminal(socket, requestedAgent)
    } else {
      connectLocalTerminal(socket)
    }

    socket.on('terminal:switch-agent', async (data: { agentId: string }) => {
      cleanupSession(socket.id)
      if (useDocker && data.agentId) {
        await connectDockerTerminal(socket, data.agentId)
      } else {
        connectLocalTerminal(socket)
      }
    })

    socket.on('terminal:claude-task', async (data: { agentId: string; task: string }) => {
      if (!data.task?.trim()) return
      const agentId = data.agentId || 'shared'
      socket.emit('terminal:output', `\r\n\x1b[36m[Claude Task] Running in ${agentId} workspace...\x1b[0m\r\n`)

      try {
        const result = await runClaudeTask(agentId, data.task, { timeout: 120_000 })
        socket.emit('terminal:output', result.output + '\r\n')
        socket.emit('terminal:output', `\x1b[32m[Claude Task] Done (exit: ${result.exitCode}, ${result.duration}ms)\x1b[0m\r\n`)

        const taskId = crypto.randomUUID()
        dbInsert('tasks', {
          id: taskId,
          name: `Claude Task: ${data.task.slice(0, 50)}`,
          description: data.task,
          type: 'workflow',
          status: 'completed',
          priority: 'medium',
          agentId,
          input: { prompt: data.task },
          output: { result: result.output, artifacts: [], logs: [] },
          progress: { current: 100, total: 100 },
          childTaskIds: [],
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        })
        socket.emit('terminal:claude-task-done', { taskId, exitCode: result.exitCode })
      } catch (err: any) {
        socket.emit('terminal:output', `\x1b[31m[Claude Task] Error: ${err.message}\x1b[0m\r\n`)
      }
    })

    socket.on('disconnect', () => {
      cleanupSession(socket.id)
    })
  })
}

function connectLocalTerminal(socket: Socket) {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'zsh')
  const cwd = os.homedir()

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: process.env as Record<string, string>,
  })

  sessions.set(socket.id, { type: 'pty', ptyProcess })

  ptyProcess.onData((data) => socket.emit('terminal:output', data))
  ptyProcess.onExit(({ exitCode }) => {
    socket.emit('terminal:exit', { exitCode })
    sessions.delete(socket.id)
  })

  socket.on('terminal:input', (data: string) => ptyProcess.write(data))
  socket.on('terminal:resize', ({ cols, rows }: { cols: number; rows: number }) => {
    ptyProcess.resize(cols, rows)
  })

  socket.emit('terminal:mode', { type: 'local' })
}

async function connectDockerTerminal(socket: Socket, agentId: string) {
  try {
    await createContainer(agentId)
    const { stream, resize } = await attachToContainer(agentId)

    sessions.set(socket.id, { type: 'docker', dockerStream: stream, dockerResize: resize, agentId })

    stream.on('data', (data: Buffer) => socket.emit('terminal:output', data.toString()))
    stream.on('end', () => {
      socket.emit('terminal:exit', { exitCode: 0 })
      sessions.delete(socket.id)
    })

    socket.on('terminal:input', (data: string) => stream.write(data))
    socket.on('terminal:resize', ({ cols, rows }: { cols: number; rows: number }) => {
      resize(cols, rows)
    })

    socket.emit('terminal:mode', { type: 'docker', agentId })
    socket.emit('terminal:output', `\x1b[32mConnected to sandbox container [${agentId.slice(0, 8)}]\x1b[0m\r\n`)
  } catch (err: any) {
    socket.emit('terminal:output', `\x1b[31mFailed to connect to sandbox: ${err.message}\x1b[0m\r\n`)
    socket.emit('terminal:output', `\x1b[33mFalling back to local terminal...\x1b[0m\r\n`)
    connectLocalTerminal(socket)
  }
}

function cleanupSession(socketId: string) {
  const session = sessions.get(socketId)
  if (!session) return

  if (session.type === 'pty' && session.ptyProcess) {
    session.ptyProcess.kill()
  } else if (session.type === 'docker' && session.dockerStream) {
    session.dockerStream.end()
  }
  sessions.delete(socketId)
}
