import { dbGetAll, dbGetOne, dbInsert } from '../db/index'
import { streamChat } from './claude'
import { agentMessageBus } from './messageBus'
import { runTeamOrchestration } from './teamOrchestrator'

let ioInstance: any = null
let autonomyTimer: ReturnType<typeof setInterval> | null = null

export function setAutonomyIO(io: any) {
  ioInstance = io
}

export interface AutonomyEvent {
  type: 'channel_message' | 'task_completed' | 'agent_request' | 'scheduled'
  sourceAgentId?: string
  targetAgentId?: string
  teamId?: string
  prompt: string
  context?: Record<string, any>
  channelId?: string
  chatId?: string
}

export async function processAutonomyEvent(event: AutonomyEvent): Promise<string | null> {
  const taskId = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (ioInstance) {
    ioInstance.emit('autonomy:event', { taskId, ...event, status: 'processing' })
  }

  try {
    let result: string

    if (event.teamId) {
      const pseudoTask = {
        id: taskId,
        name: `Autonomy: ${event.type}`,
        type: 'workflow' as const,
        teamId: event.teamId,
        input: { prompt: event.prompt },
      }
      const orchestration = await runTeamOrchestration({ task: pseudoTask })
      result = orchestration.result
    } else if (event.targetAgentId) {
      const agent = dbGetOne<any>('agents', event.targetAgentId)
      if (!agent) return null

      const contextPrompt = event.context
        ? `Context:\n${JSON.stringify(event.context, null, 2)}\n\n`
        : ''

      result = await streamChat(
        [{ role: 'user', content: contextPrompt + event.prompt }],
        agent.systemPrompt,
        agent.config?.model
      )
    } else {
      result = await streamChat([{ role: 'user', content: event.prompt }])
    }

    if (event.sourceAgentId && event.targetAgentId) {
      agentMessageBus.send({
        taskId,
        senderId: event.targetAgentId,
        receiverId: event.sourceAgentId,
        type: 'report',
        payload: { content: result, data: { eventType: event.type } },
      })
    }

    if (ioInstance) {
      ioInstance.emit('autonomy:event', {
        taskId,
        type: event.type,
        status: 'completed',
        resultPreview: result.slice(0, 200),
      })
    }

    return result
  } catch (err: any) {
    if (ioInstance) {
      ioInstance.emit('autonomy:event', { taskId, type: event.type, status: 'failed', error: err.message })
    }
    return null
  }
}

export async function checkAgentRequests(): Promise<void> {
  try {
    const recentMessages = dbGetAll<any>('agent_messages', "type = 'request'", [])
      .filter(m => {
        const age = Date.now() - new Date(m.timestamp).getTime()
        return age < 60_000
      })

    for (const msg of recentMessages) {
      const alreadyHandled = dbGetAll<any>('agent_messages',
        "type = 'report' AND senderId = ? AND taskId = ?",
        [msg.receiverId, msg.taskId]
      )
      if (alreadyHandled.length > 0) continue

      await processAutonomyEvent({
        type: 'agent_request',
        sourceAgentId: msg.senderId,
        targetAgentId: msg.receiverId === '*' ? undefined : msg.receiverId,
        prompt: msg.payload?.content || '',
        context: msg.payload?.data,
      })
    }
  } catch (err: any) {
    console.error(`[Autonomy] Request check error: ${err.message}`)
  }
}

export function startAutonomyLoop(): void {
  if (autonomyTimer) return
  console.log('[Autonomy] Agent autonomy loop started (poll every 15s)')
  autonomyTimer = setInterval(checkAgentRequests, 15_000)
}

export function stopAutonomyLoop(): void {
  if (autonomyTimer) {
    clearInterval(autonomyTimer)
    autonomyTimer = null
  }
}
