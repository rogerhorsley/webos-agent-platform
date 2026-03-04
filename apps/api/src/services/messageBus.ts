import { dbGetAll, dbInsert } from '../db/index'

export type AgentMessageType = 'dispatch' | 'report' | 'request' | 'handoff' | 'context_update'

export interface AgentMessage {
  id: string
  taskId: string
  senderId: string
  receiverId: string
  type: AgentMessageType
  payload: {
    content: string
    data?: any
    artifacts?: string[]
  }
  timestamp: string
}

export interface SharedContext {
  taskId: string
  teamId?: string
  history: AgentMessage[]
  artifacts: Record<string, any>
  variables: Record<string, any>
  metadata: {
    startedAt: string
    currentStep: number
    totalSteps: number
  }
}

let ioInstance: any = null
const sharedContexts = new Map<string, SharedContext>()

export function setMessageBusIO(io: any) {
  ioInstance = io
}

export class AgentMessageBus {
  send(message: Omit<AgentMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): AgentMessage {
    const full: AgentMessage = {
      id: message.id ?? crypto.randomUUID(),
      timestamp: message.timestamp ?? new Date().toISOString(),
      ...message,
    }

    dbInsert('agent_messages', full as any)

    const ctx = this.getOrCreateContext(full.taskId)
    ctx.history.push(full)

    if (full.type === 'context_update' && full.payload?.data && typeof full.payload.data === 'object') {
      ctx.variables = { ...ctx.variables, ...full.payload.data }
    }

    if (full.payload?.artifacts?.length) {
      for (const key of full.payload.artifacts) {
        ctx.artifacts[key] = full.payload.data?.[key]
      }
    }

    if (ioInstance) {
      ioInstance.to(`task:${full.taskId}`).emit('agent:message', full)
    }

    return full
  }

  getHistory(taskId: string): AgentMessage[] {
    const rows = dbGetAll<AgentMessage>('agent_messages', 'taskId = ?', [taskId])
    return rows.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  getForAgent(taskId: string, agentId: string): AgentMessage[] {
    const rows = dbGetAll<AgentMessage>(
      'agent_messages',
      '(taskId = ?) AND (receiverId = ? OR receiverId = ?)',
      [taskId, agentId, '*']
    )
    return rows.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  getOrCreateContext(taskId: string, teamId?: string): SharedContext {
    const existing = sharedContexts.get(taskId)
    if (existing) return existing

    const created: SharedContext = {
      taskId,
      teamId,
      history: this.getHistory(taskId),
      artifacts: {},
      variables: {},
      metadata: {
        startedAt: new Date().toISOString(),
        currentStep: 0,
        totalSteps: 0,
      },
    }
    sharedContexts.set(taskId, created)
    return created
  }

  updateProgress(taskId: string, currentStep: number, totalSteps: number) {
    const ctx = this.getOrCreateContext(taskId)
    ctx.metadata.currentStep = currentStep
    ctx.metadata.totalSteps = totalSteps
  }

  clearContext(taskId: string) {
    sharedContexts.delete(taskId)
  }

  buildContextPrompt(taskId: string, agentId: string): string {
    const ctx = this.getOrCreateContext(taskId)
    const inbox = this.getForAgent(taskId, agentId)
    const recent = inbox.slice(-8).map((m) => {
      return `- [${m.type}] ${m.senderId} -> ${m.receiverId}: ${m.payload?.content ?? ''}`
    })

    const artifactKeys = Object.keys(ctx.artifacts)
    return [
      'Shared context:',
      `- taskId: ${ctx.taskId}`,
      `- currentStep: ${ctx.metadata.currentStep}/${ctx.metadata.totalSteps}`,
      `- artifactKeys: ${artifactKeys.length ? artifactKeys.join(', ') : '(none)'}`,
      '',
      'Recent inbox messages:',
      ...(recent.length ? recent : ['- (no messages)']),
    ].join('\n')
  }
}

export const agentMessageBus = new AgentMessageBus()

