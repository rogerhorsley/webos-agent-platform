import { FastifyInstance } from 'fastify'
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceInfo,
  listWorkspaceFiles,
  readWorkspaceFile,
  writeWorkspaceFile,
  deleteWorkspaceFile,
  listAllWorkspaces,
  WORKSPACES_ROOT,
} from '../services/workspace'
import { execInWorkspace, runClaudeTask, getSandboxInfo } from '../services/sandbox'
import path from 'path'
import { existsSync } from 'fs'

export async function workspaceRoutes(fastify: FastifyInstance) {
  // Sandbox info
  fastify.get('/sandbox', async () => {
    return getSandboxInfo()
  })

  // List all workspaces
  fastify.get('/', async () => {
    const ids = listAllWorkspaces()
    const results = []
    for (const id of ids) {
      try {
        const info = await getWorkspaceInfo(id)
        results.push(info)
      } catch {
        results.push({ agentId: id, agentName: id, path: '', createdAt: '', files: 0, size: 0 })
      }
    }
    return results
  })

  // Get workspace info
  fastify.get('/:agentId', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    try {
      const info = await getWorkspaceInfo(agentId)
      return info
    } catch (err: any) {
      return reply.status(404).send({ error: err.message })
    }
  })

  // Create workspace for an agent
  fastify.post('/:agentId', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    const { agentName = agentId } = request.body as any || {}
    try {
      const info = await createWorkspace(agentId, agentName)
      return reply.status(201).send(info)
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // Delete workspace
  fastify.delete('/:agentId', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    if (agentId === 'shared') return reply.status(403).send({ error: 'Cannot delete shared workspace' })
    await deleteWorkspace(agentId)
    return reply.status(204).send()
  })

  // List files (supports ?path=subdir)
  fastify.get('/:agentId/files', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    const { path: subPath = '' } = request.query as { path?: string }
    try {
      const files = await listWorkspaceFiles(agentId, subPath)
      return files
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // Read file content
  fastify.get('/:agentId/files/*', async (request, reply) => {
    const { agentId } = request.params as { agentId: string; '*': string }
    const filePath = (request.params as any)['*']
    try {
      const content = await readWorkspaceFile(agentId, filePath)
      reply.header('Content-Type', 'text/plain; charset=utf-8')
      return content
    } catch (err: any) {
      return reply.status(404).send({ error: err.message })
    }
  })

  // Write file
  fastify.put('/:agentId/files/*', async (request, reply) => {
    const { agentId } = request.params as any
    const filePath = (request.params as any)['*']
    const { content = '' } = request.body as any || {}
    try {
      await writeWorkspaceFile(agentId, filePath, content)
      return { ok: true, path: filePath }
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // Delete file
  fastify.delete('/:agentId/files/*', async (request, reply) => {
    const { agentId } = request.params as any
    const filePath = (request.params as any)['*']
    try {
      await deleteWorkspaceFile(agentId, filePath)
      return reply.status(204).send()
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // Execute command in workspace
  fastify.post('/:agentId/exec', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    const { command, timeout, env } = request.body as {
      command: string
      timeout?: number
      env?: Record<string, string>
    }

    if (!command) return reply.status(400).send({ error: 'command is required' })

    const wsPath = agentId === 'shared'
      ? path.join(WORKSPACES_ROOT, 'shared')
      : path.join(WORKSPACES_ROOT, agentId)

    if (agentId !== 'shared' && !existsSync(wsPath)) {
      return reply.status(404).send({ error: `Workspace not found: ${agentId}` })
    }

    try {
      const result = await execInWorkspace(agentId, command, { timeout, env })
      return result
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // Run Claude Code task in workspace
  fastify.post('/:agentId/claude', async (request, reply) => {
    const { agentId } = request.params as { agentId: string }
    const { task, timeout } = request.body as { task: string; timeout?: number }

    if (!task) return reply.status(400).send({ error: 'task is required' })

    const wsPath = path.join(WORKSPACES_ROOT, agentId)
    if (!existsSync(wsPath)) {
      return reply.status(404).send({ error: `Workspace not found: ${agentId}` })
    }

    try {
      const result = await runClaudeTask(agentId, task, { timeout })
      return result
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
