import { dbGetAll, dbGetOne, dbInsert, dbUpdate } from '../db/index'
import { streamChat } from './claude'
import { handleNexusCoreChat, NEXUS_CORE_ID } from './nexusCore'
import { runTeamOrchestration } from './teamOrchestrator'
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

async function handleInboundMessage(channelId: string, channel: any, msg: ChannelMessage): Promise<void> {
  const msgId = crypto.randomUUID()
  const now = new Date().toISOString()

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

  const agentId = channel.agentId
  const teamId = channel.teamId

  if (!agentId && !teamId) return

  try {
    let reply: string

    if (agentId === NEXUS_CORE_ID) {
      const result = await handleNexusCoreChat({
        messages: [{ role: 'user', content: msg.content }],
        dispatchMode: 'auto',
      })
      reply = result.content

      if (result.dispatch) {
        const target = result.dispatch.target
        if (target.type === 'agent') {
          const agent = dbGetOne<any>('agents', target.id)
          if (agent) {
            const agentReply = await streamChat(
              [{ role: 'user', content: result.dispatch.task.prompt }],
              agent.systemPrompt,
              agent.config?.model
            )
            reply += `\n\n---\n${agent.name}: ${agentReply}`
          }
        }
      }
    } else if (teamId) {
      const pseudoTask = {
        id: `channel-${msgId}`,
        name: `Channel message from ${msg.senderName}`,
        type: 'chat',
        teamId,
        input: { prompt: msg.content },
      }
      const result = await runTeamOrchestration({ task: pseudoTask })
      reply = result.result
    } else if (agentId) {
      const agent = dbGetOne<any>('agents', agentId)
      if (!agent) return
      reply = await streamChat(
        [{ role: 'user', content: msg.content }],
        agent.systemPrompt,
        agent.config?.model
      )
    } else {
      return
    }

    if (reply) {
      await sendToChannel(channelId, msg.chatId, reply)
    }
  } catch (err: any) {
    console.error(`[ChannelManager] Error processing message: ${err.message}`)
    if (ioInstance) {
      ioInstance.emit('channel:error', { channelId, error: err.message })
    }
  }
}

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
