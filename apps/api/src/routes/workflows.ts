import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { dbGetAll, dbGetOne, dbInsert, dbUpdate, dbDelete, dbExists } from '../db/index'
import { streamChat } from '../services/claude'
import { runTeamOrchestration } from '../services/teamOrchestrator'

const WorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  variables: z.record(z.any()).optional(),
})

const RunSchema = z.object({
  input: z.string().optional(),
  variables: z.record(z.any()).optional(),
})

type NodeLike = {
  id: string
  type?: string
  data?: any
}

type EdgeLike = {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

function resolveNodeType(type?: string) {
  if (!type) return 'tool'
  if (type === 'agent_single') return 'agent'
  if (type === 'control_condition') return 'condition'
  if (type === 'control_parallel') return 'parallel'
  return type
}

function topoSort(nodes: NodeLike[], edges: EdgeLike[]): NodeLike[] {
  const indegree = new Map<string, number>()
  const outgoing = new Map<string, string[]>()

  for (const n of nodes) indegree.set(n.id, 0)
  for (const e of edges) {
    indegree.set(e.target, (indegree.get(e.target) || 0) + 1)
    if (!outgoing.has(e.source)) outgoing.set(e.source, [])
    outgoing.get(e.source)!.push(e.target)
  }

  const queue = nodes.filter((n) => (indegree.get(n.id) || 0) === 0).map((n) => n.id)
  const resultIds: string[] = []
  while (queue.length) {
    const cur = queue.shift()!
    resultIds.push(cur)
    for (const next of outgoing.get(cur) || []) {
      indegree.set(next, (indegree.get(next) || 1) - 1)
      if ((indegree.get(next) || 0) === 0) queue.push(next)
    }
  }

  if (resultIds.length !== nodes.length) return nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return resultIds.map((id) => nodeMap.get(id)!).filter(Boolean)
}

export async function workflowRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string }
    return dbGetAll('workflows', undefined, undefined, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const wf = dbGetOne('workflows', id)
    if (!wf) return reply.status(404).send({ error: 'Workflow not found' })
    return wf
  })

  fastify.post('/', async (request, reply) => {
    const body = WorkflowSchema.parse(request.body)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    dbInsert('workflows', { id, ...body, status: 'draft', createdAt: now, updatedAt: now })
    return reply.status(201).send(dbGetOne('workflows', id))
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('workflows', id)) return reply.status(404).send({ error: 'Workflow not found' })
    const body = WorkflowSchema.partial().parse(request.body)
    dbUpdate('workflows', id, { ...body, updatedAt: new Date().toISOString() })
    return dbGetOne('workflows', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('workflows', id)) return reply.status(404).send({ error: 'Workflow not found' })
    dbDelete('workflows', id)
    return reply.status(204).send()
  })

  fastify.post('/:id/run', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!dbExists('workflows', id)) return reply.status(404).send({ error: 'Workflow not found' })
    const runInput = RunSchema.parse(request.body || {})
    const wf = dbGetOne<any>('workflows', id)
    if (!wf) return reply.status(404).send({ error: 'Workflow not found' })

    const runId = crypto.randomUUID()
    const nodes: NodeLike[] = wf.nodes || []
    const edges: EdgeLike[] = wf.edges || []
    const order = topoSort(nodes, edges)
    const outputs: Record<string, any> = {}

    const incomingByNode = new Map<string, EdgeLike[]>()
    for (const edge of edges) {
      if (!incomingByNode.has(edge.target)) incomingByNode.set(edge.target, [])
      incomingByNode.get(edge.target)!.push(edge)
    }

    for (const node of order) {
      const incoming = incomingByNode.get(node.id) || []
      const upstreamTexts = incoming
        .map((e) => outputs[e.source]?.text || outputs[e.source]?.result || '')
        .filter(Boolean)

      const type = resolveNodeType(node.type)
      const promptBase = runInput.input || wf.variables?.input || node.data?.config?.prompt || node.data?.prompt || ''
      const prompt = [promptBase, ...upstreamTexts].filter(Boolean).join('\n\n')

      // trigger and data/control nodes are pass-through unless explicitly executable
      if (type === 'trigger' || type.startsWith('trigger_') || type === 'data_input' || type === 'data_transform') {
        outputs[node.id] = { text: prompt || node.data?.label || '' }
        continue
      }

      if (type === 'condition' || type === 'control_condition') {
        const text = upstreamTexts.join('\n\n')
        const pass = /success|完成|ok|true/i.test(text)
        outputs[node.id] = { text, pass }
        continue
      }

      if (type === 'parallel' || type === 'control_parallel' || type === 'control_merge') {
        outputs[node.id] = { text: upstreamTexts.join('\n\n') }
        continue
      }

      if (type === 'agent') {
        const agentId = node.data?.config?.agentId || node.data?.agentId
        const agent = agentId ? dbGetOne<any>('agents', agentId) : null
        if (!agent) {
          outputs[node.id] = { text: '', error: `Agent not found for node ${node.id}` }
          continue
        }
        const text = await streamChat(
          [{ role: 'user', content: prompt || 'Continue based on workflow context.' }],
          agent.systemPrompt,
          agent.config?.model
        )
        outputs[node.id] = { text, agentId: agent.id }
        continue
      }

      if (type === 'agent_team') {
        const teamId = node.data?.config?.teamId || node.data?.teamId
        if (!teamId) {
          outputs[node.id] = { text: '', error: `teamId missing for node ${node.id}` }
          continue
        }

        const pseudoTask = {
          id: `${runId}-${node.id}`,
          name: `Workflow Team Node ${node.id}`,
          type: 'workflow',
          teamId,
          input: { prompt: prompt || 'Execute team step.' },
        }
        const teamRun = await runTeamOrchestration({ task: pseudoTask })
        outputs[node.id] = { text: teamRun.result, mode: teamRun.mode, steps: teamRun.steps }
        continue
      }

      if (type === 'output' || type.startsWith('output_') || type === 'data_output') {
        outputs[node.id] = { text: upstreamTexts.join('\n\n') || prompt || '' }
        continue
      }

      // default no-op node
      outputs[node.id] = { text: upstreamTexts.join('\n\n') || prompt || '' }
    }

    const lastNode = order.length ? order[order.length - 1] : undefined
    const finalOutput = lastNode ? (outputs[lastNode.id]?.text ?? outputs[lastNode.id]?.result ?? '') : ''
    return {
      runId,
      workflowId: id,
      status: 'completed',
      startedAt: new Date().toISOString(),
      output: finalOutput,
      nodeOutputs: outputs,
    }
  })
}
