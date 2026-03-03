import { spawn, SpawnOptions } from 'child_process'
import path from 'path'
import os from 'os'
import { getWorkspacePath, WORKSPACES_ROOT, CLAUDE_BIN } from './workspace'

const DOCKER_AVAILABLE = process.env.SANDBOX_MODE === 'docker'
const DOCKER_IMAGE = process.env.SANDBOX_IMAGE || 'nexusos-agent:latest'

export interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

export interface ExecOptions {
  timeout?: number       // ms, default 30000
  env?: Record<string, string>
  maxBuffer?: number     // bytes
}

export interface ClaudeTaskResult {
  output: string
  exitCode: number
  duration: number
}

/**
 * Execute a shell command in an agent's workspace.
 * When Docker is available (SANDBOX_MODE=docker), runs inside a container.
 * Otherwise runs as a restricted host process with workspace as cwd.
 */
export async function execInWorkspace(
  agentId: string,
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { timeout = 30_000, env = {}, maxBuffer = 5 * 1024 * 1024 } = options
  const wsPath = agentId === 'shared' ? path.join(WORKSPACES_ROOT, 'shared') : getWorkspacePath(agentId)

  if (DOCKER_AVAILABLE) {
    return execInDocker(agentId, wsPath, command, { timeout, env, maxBuffer })
  }

  return execInProcess(wsPath, command, { timeout, env, maxBuffer })
}

/**
 * Run a Claude Code task in an agent's workspace.
 * Uses `claude --print "<task>"` for non-interactive execution.
 */
export async function runClaudeTask(
  agentId: string,
  task: string,
  options: ExecOptions = {}
): Promise<ClaudeTaskResult> {
  const wsPath = getWorkspacePath(agentId)
  const claudeBin = CLAUDE_BIN

  const command = `${claudeBin} --print ${JSON.stringify(task)}`
  const result = await execInProcess(wsPath, command, {
    timeout: options.timeout || 120_000,
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      AGENT_ID: agentId,
      HOME: wsPath,
      ...options.env,
    },
    maxBuffer: options.maxBuffer || 10 * 1024 * 1024,
  })

  return {
    output: result.stdout + (result.stderr ? `\nSTDERR: ${result.stderr}` : ''),
    exitCode: result.exitCode,
    duration: result.duration,
  }
}

// Process-based execution (current mode — no Docker)
function execInProcess(
  cwd: string,
  command: string,
  options: Required<ExecOptions>
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const safeEnv: NodeJS.ProcessEnv = {
      HOME: cwd,
      PATH: [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
        process.env.PATH || '',
      ].join(':'),
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      WORKSPACES_ROOT,
      ...options.env,
    }

    const spawnOpts: SpawnOptions = {
      cwd,
      env: safeEnv,
      shell: process.env.SHELL || '/bin/zsh',
    }

    const child = spawn(command, [], { ...spawnOpts, shell: true })

    let stdout = ''
    let stderr = ''
    let killed = false

    const timer = setTimeout(() => {
      killed = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 2000)
    }, options.timeout)

    child.stdout?.on('data', (d) => { stdout += d.toString(); if (stdout.length > options.maxBuffer) { killed = true; child.kill() } })
    child.stderr?.on('data', (d) => { stderr += d.toString() })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        stdout: stdout.slice(0, options.maxBuffer),
        stderr: stderr.slice(0, 10_000),
        exitCode: killed ? -1 : (code ?? -1),
        duration: Date.now() - start,
      })
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// Docker-based execution (activated with SANDBOX_MODE=docker)
async function execInDocker(
  agentId: string,
  wsPath: string,
  command: string,
  options: Required<ExecOptions>
): Promise<ExecResult> {
  let Docker: any
  try {
    Docker = (await import('dockerode')).default
  } catch {
    throw new Error('dockerode not available — is Docker installed?')
  }

  const docker = new Docker()
  const start = Date.now()

  // Build volume mounts: own workspace (rw) + all others (ro) + shared (rw)
  const { listAllWorkspaces } = await import('./workspace')
  const allWorkspaces = listAllWorkspaces()
  const binds = [
    `${wsPath}:/workspace:rw`,
    `${path.join(WORKSPACES_ROOT, 'shared')}:/workspaces/shared:rw`,
    ...allWorkspaces
      .filter(id => id !== agentId && id !== 'shared')
      .map(id => `${getWorkspacePath(id)}:/workspaces/${id}:ro`),
  ]

  const container = await docker.createContainer({
    Image: DOCKER_IMAGE,
    Cmd: ['/bin/sh', '-c', command],
    WorkingDir: '/workspace',
    HostConfig: {
      Binds: binds,
      Memory: 512 * 1024 * 1024, // 512MB
      CpuPeriod: 100_000,
      CpuQuota: 50_000,          // 50% CPU
      NetworkMode: 'bridge',
      AutoRemove: true,
    },
    Env: [
      `AGENT_ID=${agentId}`,
      `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
      `WORKSPACES_ROOT=/workspaces`,
      ...Object.entries(options.env).map(([k, v]) => `${k}=${v}`),
    ],
    AttachStdout: true,
    AttachStderr: true,
  })

  let stdout = ''
  let stderr = ''

  const stream = await container.attach({ stream: true, stdout: true, stderr: true })
  docker.modem.demuxStream(stream, {
    write: (d: Buffer) => { stdout += d.toString() },
  }, {
    write: (d: Buffer) => { stderr += d.toString() },
  })

  await container.start()

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(async () => {
      try { await container.kill() } catch {}
      reject(new Error(`Timeout after ${options.timeout}ms`))
    }, options.timeout)

    container.wait().then(() => {
      clearTimeout(timer)
      resolve()
    }).catch(reject)
  })

  const info = await container.inspect().catch(() => ({ State: { ExitCode: -1 } }))

  return {
    stdout,
    stderr,
    exitCode: info.State?.ExitCode ?? -1,
    duration: Date.now() - start,
  }
}

export function getSandboxMode(): 'process' | 'docker' {
  return DOCKER_AVAILABLE ? 'docker' : 'process'
}

export function getSandboxInfo() {
  return {
    mode: getSandboxMode(),
    dockerImage: DOCKER_AVAILABLE ? DOCKER_IMAGE : null,
    workspacesRoot: WORKSPACES_ROOT,
    claudeBin: CLAUDE_BIN,
    platform: os.platform(),
    nodeVersion: process.version,
  }
}
