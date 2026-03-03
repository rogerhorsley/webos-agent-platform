import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const WORKSPACES_ROOT = path.resolve(process.cwd(), 'workspaces')
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'

export interface WorkspaceInfo {
  agentId: string
  agentName: string
  path: string
  createdAt: string
  files: number
  size: number
}

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modifiedAt: string
}

export async function ensureWorkspacesRoot() {
  await fs.mkdir(WORKSPACES_ROOT, { recursive: true })
  await fs.mkdir(path.join(WORKSPACES_ROOT, 'shared'), { recursive: true })
}

export function getWorkspacePath(agentId: string): string {
  return path.join(WORKSPACES_ROOT, agentId)
}

export async function createWorkspace(agentId: string, agentName: string): Promise<WorkspaceInfo> {
  const wsPath = getWorkspacePath(agentId)
  await fs.mkdir(wsPath, { recursive: true })

  // Standard directories
  await fs.mkdir(path.join(wsPath, 'output'), { recursive: true })
  await fs.mkdir(path.join(wsPath, 'input'), { recursive: true })
  await fs.mkdir(path.join(wsPath, '.claude'), { recursive: true })

  // Claude Code configuration for this agent
  const claudeSettings = {
    version: '1',
    agent: {
      id: agentId,
      name: agentName,
    },
    permissions: {
      allow: ['Bash', 'Read', 'Write', 'Edit'],
      deny: [],
    },
    env: {
      AGENT_ID: agentId,
      AGENT_NAME: agentName,
      WORKSPACES_ROOT,
    },
  }
  await fs.writeFile(
    path.join(wsPath, '.claude', 'settings.json'),
    JSON.stringify(claudeSettings, null, 2)
  )

  // README for the workspace
  await fs.writeFile(
    path.join(wsPath, 'README.md'),
    `# Agent Workspace: ${agentName}\n\nAgent ID: \`${agentId}\`\n\nThis is the private workspace for ${agentName}.\n\n## Directories\n- \`input/\` — incoming data and prompts\n- \`output/\` — generated artifacts\n- \`.claude/\` — Claude Code configuration\n\n## Cross-Agent Access\nOther agents can read this workspace at:\n\`\`\`\n${wsPath}\n\`\`\`\n`
  )

  return getWorkspaceInfo(agentId, agentName)
}

export async function deleteWorkspace(agentId: string): Promise<void> {
  const wsPath = getWorkspacePath(agentId)
  if (existsSync(wsPath)) {
    await fs.rm(wsPath, { recursive: true, force: true })
  }
}

export async function getWorkspaceInfo(agentId: string, agentName = agentId): Promise<WorkspaceInfo> {
  const wsPath = getWorkspacePath(agentId)
  if (!existsSync(wsPath)) {
    throw new Error(`Workspace not found for agent: ${agentId}`)
  }

  const stat = await fs.stat(wsPath)
  const files = await countFiles(wsPath)
  const size = await getDirSize(wsPath)

  return {
    agentId,
    agentName,
    path: wsPath,
    createdAt: stat.birthtime.toISOString(),
    files,
    size,
  }
}

export async function listWorkspaceFiles(agentId: string, subPath = ''): Promise<FileEntry[]> {
  const basePath = agentId === 'shared' ? path.join(WORKSPACES_ROOT, 'shared') : getWorkspacePath(agentId)
  const targetPath = subPath ? path.join(basePath, subPath) : basePath

  // Security: prevent path traversal
  if (!targetPath.startsWith(WORKSPACES_ROOT)) {
    throw new Error('Access denied: path traversal detected')
  }

  if (!existsSync(targetPath)) return []

  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  const result: FileEntry[] = []

  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name)
    const stat = await fs.stat(fullPath)
    result.push({
      name: entry.name,
      path: path.join(subPath, entry.name),
      type: entry.isDirectory() ? 'directory' : 'file',
      size: entry.isFile() ? stat.size : undefined,
      modifiedAt: stat.mtime.toISOString(),
    })
  }

  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function readWorkspaceFile(agentId: string, filePath: string): Promise<string> {
  const basePath = agentId === 'shared' ? path.join(WORKSPACES_ROOT, 'shared') : getWorkspacePath(agentId)
  const fullPath = path.join(basePath, filePath)

  if (!fullPath.startsWith(WORKSPACES_ROOT)) {
    throw new Error('Access denied: path traversal detected')
  }

  return fs.readFile(fullPath, 'utf-8')
}

export async function writeWorkspaceFile(agentId: string, filePath: string, content: string): Promise<void> {
  const wsPath = agentId === 'shared' ? path.join(WORKSPACES_ROOT, 'shared') : getWorkspacePath(agentId)
  const fullPath = path.join(wsPath, filePath)

  if (!fullPath.startsWith(WORKSPACES_ROOT)) {
    throw new Error('Access denied: path traversal detected')
  }

  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')
}

export async function deleteWorkspaceFile(agentId: string, filePath: string): Promise<void> {
  const wsPath = agentId === 'shared' ? path.join(WORKSPACES_ROOT, 'shared') : getWorkspacePath(agentId)
  const fullPath = path.join(wsPath, filePath)
  if (!fullPath.startsWith(WORKSPACES_ROOT)) {
    throw new Error('Access denied: path traversal detected')
  }
  await fs.rm(fullPath, { recursive: true, force: true })
}

export function listAllWorkspaces(): string[] {
  try {
    const { readdirSync, statSync } = require('fs')
    return readdirSync(WORKSPACES_ROOT)
      .filter((name: string) => statSync(path.join(WORKSPACES_ROOT, name)).isDirectory())
  } catch {
    return []
  }
}

export { WORKSPACES_ROOT, CLAUDE_BIN }

async function countFiles(dir: string): Promise<number> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    let count = entries.filter(e => e.isFile()).length
    for (const e of entries.filter(e => e.isDirectory())) {
      count += await countFiles(path.join(dir, e.name))
    }
    return count
  } catch {
    return 0
  }
}

async function getDirSize(dir: string): Promise<number> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    let size = 0
    for (const e of entries) {
      const p = path.join(dir, e.name)
      if (e.isFile()) {
        const s = await fs.stat(p)
        size += s.size
      } else if (e.isDirectory()) {
        size += await getDirSize(p)
      }
    }
    return size
  } catch {
    return 0
  }
}
