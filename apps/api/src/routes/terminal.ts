import { Server, Socket } from 'socket.io'
import * as pty from 'node-pty'
import os from 'os'

const sessions = new Map<string, ReturnType<typeof pty.spawn>>()

export function setupTerminalSocket(io: Server) {
  const termNs = io.of('/terminal')

  termNs.on('connection', (socket: Socket) => {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'zsh')
    const cwd = os.homedir()

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as Record<string, string>,
    })

    sessions.set(socket.id, ptyProcess)

    ptyProcess.onData((data) => {
      socket.emit('terminal:output', data)
    })

    ptyProcess.onExit(({ exitCode }) => {
      socket.emit('terminal:exit', { exitCode })
      sessions.delete(socket.id)
    })

    socket.on('terminal:input', (data: string) => {
      ptyProcess.write(data)
    })

    socket.on('terminal:resize', ({ cols, rows }: { cols: number; rows: number }) => {
      ptyProcess.resize(cols, rows)
    })

    socket.on('disconnect', () => {
      ptyProcess.kill()
      sessions.delete(socket.id)
    })
  })
}
