import { dbGetOne, dbInsert, dbUpdate } from '../db/index'
import { streamChat } from './claude'
import { agentMessageBus } from './messageBus'

interface TeamRunResult {
  result: string
  mode: 'sequential' | 'parallel' | 'hierarchical'
  steps: Array<{ agentId: string; agentName: string; output: string }>
}

function getTeamMembers(team: any) {
  return (team.agentIds || [])
    .map((id: string) => dbGetOne<any>('agents', id))
    .filter(Boolean)
}

function emitTeam(ioEmit: ((event: string, payload: any) => void) | undefined, event: string, payload: any) {
  ioEmit?.(event, payload)
}

async function runOneAgent(params: {
  taskId: string
  teamId: string
  senderId: string
  agent: any
  prompt: string
  contextPrompt?: string
  onToken?: (token: string) => void
}) {
  const { taskId, teamId, senderId, agent, prompt, contextPrompt, onToken } = params

  agentMessageBus.send({
    taskId,
    senderId,
    receiverId: agent.id,
    type: 'dispatch',
    payload: { content: prompt, data: { teamId } },
  })

  const full = await streamChat(
    [{ role: 'user', content: prompt }],
    [agent.systemPrompt, contextPrompt].filter(Boolean).join('\n\n'),
    agent.config?.model,
    {
      onToken: (token) => onToken?.(token),
      onDone: () => {},
      onError: () => {},
    }
  )

  agentMessageBus.send({
    taskId,
    senderId: agent.id,
    receiverId: senderId,
    type: 'report',
    payload: {
      content: `Completed by ${agent.name}`,
      data: { output: full, agentId: agent.id },
      artifacts: [`${agent.id}:output`],
    },
  })

  return full
}

function parsePlannerJson(raw: string): Array<{ agentId: string; prompt: string }> | null {
  const match = raw.match(/```json\s*([\s\S]*?)```/i)
  const text = match ? match[1] : raw
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x: any) => typeof x?.agentId === 'string' && typeof x?.prompt === 'string')
        .map((x: any) => ({ agentId: x.agentId, prompt: x.prompt }))
    }
  } catch {
    return null
  }
  return null
}

export async function runTeamOrchestration(params: {
  task: any
  ioEmit?: (event: string, payload: any) => void
}): Promise<TeamRunResult> {
  const { task, ioEmit } = params
  const team = dbGetOne<any>('agent_teams', task.teamId)
  if (!team) throw new Error(`Team ${task.teamId} not found`)

  const members = getTeamMembers(team)
  if (!members.length) throw new Error(`Team ${team.name} has no members`)

  const mode = (team.communicationMode || 'sequential') as 'sequential' | 'parallel' | 'hierarchical'
  const coordinatorId = team.coordinatorId || members[0]?.id
  const coordinator = members.find((m: any) => m.id === coordinatorId) || members[0]
  const steps: Array<{ agentId: string; agentName: string; output: string }> = []

  const ctx = agentMessageBus.getOrCreateContext(task.id, team.id)
  ctx.metadata.totalSteps =
    mode === 'hierarchical'
      ? Math.max(2, members.length + 1)
      : members.length

  emitTeam(ioEmit, 'team:progress', {
    teamId: team.id,
    taskId: task.id,
    status: 'running',
    step: 0,
    totalSteps: ctx.metadata.totalSteps,
    mode,
  })

  if (mode === 'sequential') {
    let workingPrompt = task.input.prompt
    let i = 0
    for (const agent of members) {
      i += 1
      agentMessageBus.updateProgress(task.id, i, members.length)
      emitTeam(ioEmit, 'team:step', {
        teamId: team.id,
        taskId: task.id,
        step: i,
        totalSteps: members.length,
        agentId: agent.id,
        agentName: agent.name,
        status: 'running',
      })

      const output = await runOneAgent({
        taskId: task.id,
        teamId: team.id,
        senderId: coordinator.id,
        agent,
        prompt: workingPrompt,
        contextPrompt: agentMessageBus.buildContextPrompt(task.id, agent.id),
        onToken: (token) => emitTeam(ioEmit, 'team:token', { taskId: task.id, teamId: team.id, agentId: agent.id, token }),
      })
      steps.push({ agentId: agent.id, agentName: agent.name, output })
      workingPrompt = `Previous output from ${agent.name}:\n${output}\n\nContinue and improve this result for the same task.`

      emitTeam(ioEmit, 'team:step', {
        teamId: team.id,
        taskId: task.id,
        step: i,
        totalSteps: members.length,
        agentId: agent.id,
        agentName: agent.name,
        status: 'completed',
      })
    }

    return {
      result: steps[steps.length - 1]?.output || '',
      mode,
      steps,
    }
  }

  if (mode === 'parallel') {
    const outputs = await Promise.all(
      members.map(async (agent: any, idx: number) => {
        const step = idx + 1
        emitTeam(ioEmit, 'team:step', {
          teamId: team.id,
          taskId: task.id,
          step,
          totalSteps: members.length,
          agentId: agent.id,
          agentName: agent.name,
          status: 'running',
        })
        const output = await runOneAgent({
          taskId: task.id,
          teamId: team.id,
          senderId: coordinator.id,
          agent,
          prompt: task.input.prompt,
          contextPrompt: agentMessageBus.buildContextPrompt(task.id, agent.id),
          onToken: (token) => emitTeam(ioEmit, 'team:token', { taskId: task.id, teamId: team.id, agentId: agent.id, token }),
        })
        emitTeam(ioEmit, 'team:step', {
          teamId: team.id,
          taskId: task.id,
          step,
          totalSteps: members.length,
          agentId: agent.id,
          agentName: agent.name,
          status: 'completed',
        })
        return { agent, output }
      })
    )

    for (const item of outputs) {
      steps.push({ agentId: item.agent.id, agentName: item.agent.name, output: item.output })
    }

    const mergePrompt = [
      `User task: ${task.input.prompt}`,
      '',
      'Merge these parallel agent outputs into one final answer:',
      ...outputs.map((o) => `### ${o.agent.name}\n${o.output}`),
    ].join('\n')

    const merged = await runOneAgent({
      taskId: task.id,
      teamId: team.id,
      senderId: coordinator.id,
      agent: coordinator,
      prompt: mergePrompt,
      contextPrompt: agentMessageBus.buildContextPrompt(task.id, coordinator.id),
    })
    steps.push({ agentId: coordinator.id, agentName: coordinator.name, output: merged })

    return { result: merged, mode, steps }
  }

  // hierarchical
  const workers = members.filter((m: any) => m.id !== coordinator.id)
  const planPrompt = [
    `Task: ${task.input.prompt}`,
    'Workers:',
    ...workers.map((w: any) => `- ${w.id}: ${w.name} (${w.role})`),
    'Return STRICT JSON array: [{"agentId":"...","prompt":"..."}]',
  ].join('\n')

  const plannerRaw = await runOneAgent({
    taskId: task.id,
    teamId: team.id,
    senderId: coordinator.id,
    agent: coordinator,
    prompt: planPrompt,
    contextPrompt: agentMessageBus.buildContextPrompt(task.id, coordinator.id),
  })

  const planned = parsePlannerJson(plannerRaw)
  const assignments =
    planned && planned.length
      ? planned
      : workers.map((w: any) => ({ agentId: w.id, prompt: `${task.input.prompt}\n\nFocus on your specialty as ${w.role}.` }))

  const workerOutputs: Array<{ agent: any; output: string }> = []
  let step = 0
  for (const assignment of assignments) {
    const worker = members.find((m: any) => m.id === assignment.agentId)
    if (!worker) continue
    step += 1
    emitTeam(ioEmit, 'team:step', {
      teamId: team.id,
      taskId: task.id,
      step,
      totalSteps: assignments.length + 1,
      agentId: worker.id,
      agentName: worker.name,
      status: 'running',
    })
    const output = await runOneAgent({
      taskId: task.id,
      teamId: team.id,
      senderId: coordinator.id,
      agent: worker,
      prompt: assignment.prompt,
      contextPrompt: agentMessageBus.buildContextPrompt(task.id, worker.id),
    })
    workerOutputs.push({ agent: worker, output })
    steps.push({ agentId: worker.id, agentName: worker.name, output })
    emitTeam(ioEmit, 'team:step', {
      teamId: team.id,
      taskId: task.id,
      step,
      totalSteps: assignments.length + 1,
      agentId: worker.id,
      agentName: worker.name,
      status: 'completed',
    })
  }

  const summaryPrompt = [
    `Original task: ${task.input.prompt}`,
    'Summarize and produce final answer from worker reports:',
    ...workerOutputs.map((w) => `### ${w.agent.name}\n${w.output}`),
  ].join('\n')

  const summary = await runOneAgent({
    taskId: task.id,
    teamId: team.id,
    senderId: coordinator.id,
    agent: coordinator,
    prompt: summaryPrompt,
    contextPrompt: agentMessageBus.buildContextPrompt(task.id, coordinator.id),
  })
  steps.push({ agentId: coordinator.id, agentName: coordinator.name, output: summary })

  return { result: summary, mode, steps }
}

export function createChildTask(parentTask: any, attrs: { name: string; agentId?: string; teamId?: string; input: any }) {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  dbInsert('tasks', {
    id,
    name: attrs.name,
    description: parentTask.description || null,
    type: parentTask.type || 'workflow',
    status: 'completed',
    priority: parentTask.priority || 'medium',
    agentId: attrs.agentId,
    teamId: attrs.teamId,
    input: attrs.input,
    output: {},
    progress: { current: 100, total: 100 },
    parentTaskId: parentTask.id,
    childTaskIds: [],
    createdAt: now,
    startedAt: now,
    completedAt: now,
  })
  return id
}

export function appendChildTasks(parentTaskId: string, childIds: string[]) {
  const task = dbGetOne<any>('tasks', parentTaskId)
  const merged = Array.from(new Set([...(task?.childTaskIds || []), ...childIds]))
  dbUpdate('tasks', parentTaskId, { childTaskIds: merged })
}

