import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { WORKSPACES_ROOT } from './workspace'

const SANDBOX_IMAGE = process.env.SANDBOX_IMAGE || 'nexusos-agent:latest'
const CONTAINER_PREFIX = 'nexusos-agent-'
const DOCKER_HOST = process.env.DOCKER_HOST || ''
const DOCKER_TLS_CA = process.env.DOCKER_TLS_CA || ''
const DOCKER_TLS_CERT = process.env.DOCKER_TLS_CERT || ''
const DOCKER_TLS_KEY = process.env.DOCKER_TLS_KEY || ''

const REMOTE_WORKSPACES = process.env.REMOTE_WORKSPACES_ROOT || '/opt/nexusos/workspaces'

type ContainerState = 'running' | 'stopped' | 'creating' | 'error' | 'not_found'

export interface ContainerInfo {
  containerId: string
  agentId: string
  state: ContainerState
  image: string
  createdAt?: string
  startedAt?: string
  ports?: Record<string, string>
  remote?: boolean
}

let dockerInstance: any = null

function readCert(filePath: string): Buffer | undefined {
  if (!filePath) return undefined
  const resolved = path.resolve(filePath)
  if (existsSync(resolved)) return readFileSync(resolved)
  return undefined
}

function isRemoteDocker(): boolean {
  return DOCKER_HOST.startsWith('tcp://') || DOCKER_HOST.startsWith('ssh://')
}

function getWorkspaceBindPath(agentId: string): string {
  if (isRemoteDocker()) {
    return path.posix.join(REMOTE_WORKSPACES, agentId)
  }
  return path.join(WORKSPACES_ROOT, agentId)
}

function getSharedBindPath(): string {
  if (isRemoteDocker()) {
    return path.posix.join(REMOTE_WORKSPACES, 'shared')
  }
  return path.join(WORKSPACES_ROOT, 'shared')
}

async function getDocker() {
  if (dockerInstance) return dockerInstance
  try {
    const Dockerode = (await import('dockerode')).default

    if (isRemoteDocker()) {
      const url = new URL(DOCKER_HOST)
      const opts: any = {
        host: url.hostname,
        port: parseInt(url.port) || 2376,
        protocol: 'https',
      }

      const ca = readCert(DOCKER_TLS_CA)
      const cert = readCert(DOCKER_TLS_CERT)
      const key = readCert(DOCKER_TLS_KEY)

      if (ca && cert && key) {
        opts.ca = ca
        opts.cert = cert
        opts.key = key
      }

      dockerInstance = new Dockerode(opts)
    } else {
      dockerInstance = new Dockerode()
    }

    await dockerInstance.ping()
    console.log(`[Docker] Connected to ${isRemoteDocker() ? DOCKER_HOST : 'local Docker'}`)
    return dockerInstance
  } catch (err: any) {
    throw new Error(`Docker not available: ${err.message}. ${isRemoteDocker() ? `Check DOCKER_HOST=${DOCKER_HOST} and TLS certs.` : 'Install Docker Desktop or configure DOCKER_HOST for remote.'}`)
  }
}

function containerName(agentId: string) {
  return `${CONTAINER_PREFIX}${agentId}`
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    await getDocker()
    return true
  } catch {
    return false
  }
}

export async function ensureImage(): Promise<boolean> {
  try {
    const docker = await getDocker()
    const images = await docker.listImages({ filters: { reference: [SANDBOX_IMAGE] } })
    return images.length > 0
  } catch {
    return false
  }
}

export async function getContainerInfo(agentId: string): Promise<ContainerInfo> {
  const docker = await getDocker()
  const name = containerName(agentId)

  try {
    const container = docker.getContainer(name)
    const info = await container.inspect()
    return {
      containerId: info.Id.slice(0, 12),
      agentId,
      state: info.State.Running ? 'running' : 'stopped',
      image: info.Config.Image,
      createdAt: info.Created,
      startedAt: info.State.StartedAt,
      remote: isRemoteDocker(),
    }
  } catch (err: any) {
    if (err.statusCode === 404) {
      return { containerId: '', agentId, state: 'not_found', image: SANDBOX_IMAGE, remote: isRemoteDocker() }
    }
    return { containerId: '', agentId, state: 'error', image: SANDBOX_IMAGE, remote: isRemoteDocker() }
  }
}

export async function createContainer(agentId: string): Promise<ContainerInfo> {
  const docker = await getDocker()
  const name = containerName(agentId)
  const wsPath = getWorkspaceBindPath(agentId)
  const sharedPath = getSharedBindPath()

  const existing = await getContainerInfo(agentId)
  if (existing.state !== 'not_found') {
    if (existing.state === 'running') return existing
    const container = docker.getContainer(name)
    await container.start()
    return getContainerInfo(agentId)
  }

  const container = await docker.createContainer({
    name,
    Image: SANDBOX_IMAGE,
    Cmd: ['/bin/bash'],
    Tty: true,
    OpenStdin: true,
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: '/workspace',
    Hostname: `agent-${agentId.slice(0, 8)}`,
    HostConfig: {
      Binds: [
        `${wsPath}:/workspace:rw`,
        `${sharedPath}:/workspaces/shared:rw`,
      ],
      Memory: 512 * 1024 * 1024,
      CpuPeriod: 100_000,
      CpuQuota: 50_000,
      NetworkMode: 'bridge',
      RestartPolicy: { Name: 'unless-stopped' },
    },
    Env: [
      `AGENT_ID=${agentId}`,
      `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}`,
      `WORKSPACES_ROOT=/workspaces`,
      `TERM=xterm-256color`,
      `LANG=en_US.UTF-8`,
    ],
    Labels: {
      'nexusos.agent': agentId,
      'nexusos.managed': 'true',
    },
  })

  await container.start()
  return getContainerInfo(agentId)
}

export async function startContainer(agentId: string): Promise<ContainerInfo> {
  const docker = await getDocker()
  const name = containerName(agentId)
  try {
    const container = docker.getContainer(name)
    await container.start()
  } catch (err: any) {
    if (err.statusCode === 304) { /* already running */ }
    else if (err.statusCode === 404) return createContainer(agentId)
    else throw err
  }
  return getContainerInfo(agentId)
}

export async function stopContainer(agentId: string): Promise<ContainerInfo> {
  const docker = await getDocker()
  const name = containerName(agentId)
  try {
    const container = docker.getContainer(name)
    await container.stop({ t: 5 })
  } catch (err: any) {
    if (err.statusCode !== 304 && err.statusCode !== 404) throw err
  }
  return getContainerInfo(agentId)
}

export async function removeContainer(agentId: string): Promise<void> {
  const docker = await getDocker()
  const name = containerName(agentId)
  try {
    const container = docker.getContainer(name)
    await container.stop({ t: 2 }).catch(() => {})
    await container.remove({ force: true })
  } catch (err: any) {
    if (err.statusCode !== 404) throw err
  }
}

export async function restartContainer(agentId: string): Promise<ContainerInfo> {
  const docker = await getDocker()
  const name = containerName(agentId)
  try {
    const container = docker.getContainer(name)
    await container.restart({ t: 5 })
  } catch (err: any) {
    if (err.statusCode === 404) return createContainer(agentId)
    throw err
  }
  return getContainerInfo(agentId)
}

export async function execInContainer(agentId: string, command: string, options: {
  timeout?: number
  env?: Record<string, string>
} = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const docker = await getDocker()
  const name = containerName(agentId)
  const container = docker.getContainer(name)

  const info = await container.inspect()
  if (!info.State.Running) {
    await container.start()
  }

  const exec = await container.exec({
    Cmd: ['/bin/bash', '-c', command],
    AttachStdout: true,
    AttachStderr: true,
    Env: options.env ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`) : undefined,
    WorkingDir: '/workspace',
  })

  const stream = await exec.start({ hijack: true, stdin: false })

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      stream.destroy()
      resolve({ stdout, stderr, exitCode: -1 })
    }, options.timeout || 30_000)

    docker.modem.demuxStream(
      stream,
      { write: (d: Buffer) => { stdout += d.toString() } },
      { write: (d: Buffer) => { stderr += d.toString() } }
    )

    stream.on('end', async () => {
      clearTimeout(timer)
      try {
        const inspectResult = await exec.inspect()
        resolve({ stdout, stderr, exitCode: inspectResult.ExitCode ?? -1 })
      } catch {
        resolve({ stdout, stderr, exitCode: -1 })
      }
    })

    stream.on('error', (err: Error) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

export async function attachToContainer(agentId: string): Promise<{
  stream: any
  resize: (cols: number, rows: number) => Promise<void>
}> {
  const docker = await getDocker()
  const name = containerName(agentId)
  const container = docker.getContainer(name)

  const info = await container.inspect()
  if (!info.State.Running) {
    await container.start()
  }

  const exec = await container.exec({
    Cmd: ['/bin/bash'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  })

  const stream = await exec.start({ hijack: true, stdin: true, Tty: true })

  return {
    stream,
    resize: async (cols: number, rows: number) => {
      try {
        await exec.resize({ h: rows, w: cols })
      } catch { /* ignore resize errors */ }
    },
  }
}

export async function listManagedContainers(): Promise<ContainerInfo[]> {
  const docker = await getDocker()
  const containers = await docker.listContainers({
    all: true,
    filters: { label: ['nexusos.managed=true'] },
  })

  return containers.map((c: any) => ({
    containerId: c.Id.slice(0, 12),
    agentId: c.Labels?.['nexusos.agent'] || 'unknown',
    state: c.State === 'running' ? 'running' as const : 'stopped' as const,
    image: c.Image,
    createdAt: new Date(c.Created * 1000).toISOString(),
  }))
}

export function getSandboxConfig() {
  return {
    image: SANDBOX_IMAGE,
    prefix: CONTAINER_PREFIX,
    workspacesRoot: isRemoteDocker() ? REMOTE_WORKSPACES : WORKSPACES_ROOT,
    dockerHost: DOCKER_HOST || 'local',
    remote: isRemoteDocker(),
    memoryLimit: '512MB',
    cpuLimit: '50%',
  }
}
