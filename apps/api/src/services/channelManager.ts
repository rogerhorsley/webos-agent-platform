import { dbGetAll, dbGetOne, dbInsert, dbUpdate } from '../db/index'
import { streamChat } from './claude'
import { handleNexusCoreChat, NEXUS_CORE_ID, type DispatchDirective } from './nexusCore'
import { runTeamOrchestration } from './teamOrchestrator'
import { enqueueTask } from './taskQueue'
import { agentMessageBus } from './messageBus'

export interface ChannelMessage {
  chatId: string
  senderId?: string
  senderName?: string
  content: string
  metadata?: Record<string, any>
}

export interface ChannelAdapter {
  type: string
  connect(config: Record<string, any>): Promise<void>
  disconnect(): Promise<void>
  sendMessage(chatId: string, text: string): Promise<void>
  isConnected(): boolean
  onMessage(callback: (msg: ChannelMessage) => void): void
}

export type ChannelAdapterFactory = (channelId: string) => ChannelAdapter

const adapterFactories = new Map<string, ChannelAdapterFactory>()
const activeAdapters = new Map<string, ChannelAdapter>()

let ioInstance: any = null

export function setChannelManagerIO(io: any) {
  ioInstance = io
}

export function registerAdapterType(type: string, factory: ChannelAdapterFactory) {
  adapterFactories.set(type, factory)
}

export function getActiveAdapter(channelId: string): ChannelAdapter | undefined {
  return activeAdapters.get(channelId)
}

export async function startChannel(channelId: string): Promise<void> {
  const channel = dbGetOne<any>('channels', channelId)
  if (!channel) throw new Error(`Channel ${channelId} not found`)

  const factory = adapterFactories.get(channel.type)
  if (!factory) throw new Error(`No adapter registered for type: ${channel.type}`)

  if (activeAdapters.has(channelId)) {
    await stopChannel(channelId)
  }

  const adapter = factory(channelId)

  adapter.onMessage(async (msg) => {
    await handleInboundMessage(channelId, channel, msg)
  })

  await adapter.connect(channel.config || {})
  activeAdapters.set(channelId, adapter)
  dbUpdate('channels', channelId, { status: 'connected', updatedAt: new Date().toISOString() })

  if (ioInstance) {
    ioInstance.emit('channel:status', { channelId, status: 'connected' })
  }
}

export async function stopChannel(channelId: string): Promise<void> {
  const adapter = activeAdapters.get(channelId)
  if (adapter) {
    await adapter.disconnect()
    activeAdapters.delete(channelId)
  }
  dbUpdate('channels', channelId, { status: 'disconnected', updatedAt: new Date().toISOString() })

  if (ioInstance) {
    ioInstance.emit('channel:status', { channelId, status: 'disconnected' })
  }
}

export async function sendToChannel(channelId: string, chatId: string, text: string): Promise<void> {
  const adapter = activeAdapters.get(channelId)
  if (!adapter || !adapter.isConnected()) {
    throw new Error(`Channel ${channelId} is not connected`)
  }

  await adapter.sendMessage(chatId, text)

  dbInsert('channel_messages', {
    id: crypto.randomUUID(),
    channelId,
    chatId,
    senderId: 'system',
    senderName: 'NexusOS',
    content: text,
    direction: 'outbound',
    metadata: {},
    timestamp: new Date().toISOString(),
  })
}

// ── Build conversation history from recent channel messages ──────────────────

function getChannelHistory(channelId: string, chatId: string, limit = 10): Array<{ role: 'user' | 'assistant'; content: string }> {
  const rows = dbGetAll<any>(
    'channel_messages',
    'channelId = ? AND chatId = ?',
    [channelId, chatId]
  )
  const recent = rows.slice(-limit)
  return recent.map((r: any) => ({
    role: r.direction === 'inbound' ? 'user' as const : 'assistant' as const,
    content: r.content,
  }))
}

// ── Wait for a task to complete (polling) ────────────────────────────────────

async function waitForTaskCompletion(taskId: string, timeoutMs = 120_000): Promise<any> {
  const start = Date.now()
  const interval = 2000
  while (Date.now() - start < timeoutMs) {
    const task = dbGetOne<any>('tasks', taskId)
    if (!task) return null
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return task
    }
    await new Promise(r => setTimeout(r, interval))
  }
  return dbGetOne<any>('tasks', taskId)
}

// ── Create a task from NexusCore dispatch directive ──────────────────────────

function createTaskFromDispatch(dispatch: DispatchDirective, sourceInfo: { channelId: string; chatId: string; senderName?: string }): string {
  const taskId = crypto.randomUUID()
  const now = new Date().toISOString()

  const task: Record<string, any> = {
    id: taskId,
    name: dispatch.task.name,
    description: `[${sourceInfo.senderName || 'Channel'}] ${dispatch.reason || dispatch.task.name}`,
    type: 'chat',
    priority: 'medium',
    status: 'pending',
    input: {
      prompt: dispatch.task.prompt,
      context: dispatch.task.context || undefined,
    },
    progress: { current: 0, total: 100 },
    childTaskIds: [],
    createdAt: now,
  }

  if (dispatch.target.type === 'agent') {
    task.agentId = dispatch.target.id
  } else if (dispatch.target.type === 'team') {
    task.teamId = dispatch.target.id
    if (dispatch.communicationMode) {
      task.input.communicationMode = dispatch.communicationMode
    }
  }

  dbInsert('tasks', task)
  return taskId
}

// ── Format task result for channel reply ─────────────────────────────────────

function formatTaskResult(task: any): string {
  if (task.status === 'completed') {
    const output = task.output
    if (typeof output === 'string') return output
    if (output?.result) return String(output.result)
    return JSON.stringify(output)
  }
  if (task.status === 'failed') {
    const logs = task.output?.logs
    const errMsg = logs?.[0]?.message || 'Unknown error'
    return `❌ Task failed: ${errMsg}`
  }
  return `⚠️ Task ended with status: ${task.status}`
}

// ── Core inbound message handler ─────────────────────────────────────────────

async function handleInboundMessage(channelId: string, channel: any, msg: ChannelMessage): Promise<void> {
  const msgId = crypto.randomUUID()
  const now = new Date().toISOString()

  // 1. Persist inbound message
  dbInsert('channel_messages', {
    id: msgId,
    channelId,
    chatId: msg.chatId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    content: msg.content,
    direction: 'inbound',
    metadata: msg.metadata || {},
    timestamp: now,
  })

  if (ioInstance) {
    ioInstance.emit('channel:message', {
      channelId,
      chatId: msg.chatId,
      senderName: msg.senderName,
      content: msg.content,
      direction: 'inbound',
      timestamp: now,
    })
  }

  // 2. All channel messages are routed through NexusCore
  //    NexusCore acts as the central coordinator: it either replies directly
  //    or creates a task and dispatches to the appropriate agent/team.
  try {
    const history = getChannelHistory(channelId, msg.chatId, 10)

    const result = await handleNexusCoreChat({
      messages: history,
      dispatchMode: 'auto',
    })

    // 3. Send NexusCore's direct reply
    if (result.content) {
      await sendToChannel(channelId, msg.chatId, result.content)
    }

    // 4. If NexusCore decided to dispatch, create a task and execute it
    if (result.dispatch) {
      const dispatch = result.dispatch
      const targetName = getTargetName(dispatch)

      const taskId = createTaskFromDispatch(dispatch, {
        channelId,
        chatId: msg.chatId,
        senderName: msg.senderName,
      })

      // Notify channel: task created
      await sendToChannel(channelId, msg.chatId,
        `📋 Task created: ${dispatch.task.name}\n🤖 Assigned to: ${targetName}\n⏳ Executing...`)

      if (ioInstance) {
        ioInstance.emit('channel:task', {
          channelId,
          chatId: msg.chatId,
          taskId,
          dispatch,
        })
      }

      // Enqueue and execute via task queue
      try {
        dbUpdate('tasks', taskId, { status: 'queued' })
        await enqueueTask(taskId)
      } catch {
        // Redis unavailable: run synchronously as fallback
        await executeTaskSynchronously(taskId, dispatch)
      }

      // Wait for task completion and send result back
      const completedTask = await waitForTaskCompletion(taskId)
      if (completedTask) {
        const resultText = formatTaskResult(completedTask)
        await sendToChannel(channelId, msg.chatId,
          `✅ ${dispatch.task.name}\n\n${resultText}`)

        if (ioInstance) {
          ioInstance.emit('channel:taskDone', {
            channelId,
            chatId: msg.chatId,
            taskId,
            status: completedTask.status,
          })
        }
      }
    }
  } catch (err: any) {
    console.error(`[ChannelManager] Error processing message: ${err.message}`)
    try {
      await sendToChannel(channelId, msg.chatId, `⚠️ Error: ${err.message}`)
    } catch {}
    if (ioInstance) {
      ioInstance.emit('channel:error', { channelId, error: err.message })
    }
  }
}

// ── Get display name for dispatch target ─────────────────────────────────────

function getTargetName(dispatch: DispatchDirective): string {
  if (dispatch.target.type === 'agent') {
    const agent = dbGetOne<any>('agents', dispatch.target.id)
    return agent?.name || dispatch.target.id
  }
  if (dispatch.target.type === 'team') {
    const team = dbGetOne<any>('agent_teams', dispatch.target.id)
    return team?.name || dispatch.target.id
  }
  return dispatch.target.id
}

// ── Synchronous fallback when Redis/BullMQ is unavailable ────────────────────

async function executeTaskSynchronously(taskId: string, dispatch: DispatchDirective): Promise<void> {
  dbUpdate('tasks', taskId, { status: 'running', startedAt: new Date().toISOString() })

  try {
    let result: string

    if (dispatch.target.type === 'team') {
      const task = dbGetOne<any>('tasks', taskId)
      const orchestration = await runTeamOrchestration({ task })
      result = orchestration.result
    } else {
      const agent = dbGetOne<any>('agents', dispatch.target.id)
      result = await streamChat(
        [{ role: 'user', content: dispatch.task.prompt }],
        agent?.systemPrompt,
        agent?.config?.model
      )
    }

    dbUpdate('tasks', taskId, {
      status: 'completed',
      output: { result, artifacts: [], logs: [] },
      progress: { current: 100, total: 100 },
      completedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    dbUpdate('tasks', taskId, {
      status: 'failed',
      output: { result: null, logs: [{ level: 'error', message: err.message }] },
      completedAt: new Date().toISOString(),
    })
  }
}

// ── Channel lifecycle ────────────────────────────────────────────────────────

export async function restoreChannels(): Promise<void> {
  const channels = dbGetAll<any>('channels', 'status = ?', ['connected'])
  for (const ch of channels) {
    try {
      await startChannel(ch.id)
    } catch (err: any) {
      console.error(`[ChannelManager] Failed to restore channel ${ch.name}: ${err.message}`)
      dbUpdate('channels', ch.id, { status: 'error', updatedAt: new Date().toISOString() })
    }
  }
}

export function getChannelStats() {
  const all = dbGetAll<any>('channels')
  return {
    total: all.length,
    connected: all.filter(c => c.status === 'connected').length,
    types: [...new Set(all.map(c => c.type))],
  }
}
