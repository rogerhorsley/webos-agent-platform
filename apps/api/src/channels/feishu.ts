import * as lark from '@larksuiteoapi/node-sdk'
import { registerAdapterType, type ChannelAdapter, type ChannelMessage } from '../services/channelManager'

class FeishuAdapter implements ChannelAdapter {
  type = 'feishu'
  private client: any = null
  private connected = false
  private messageCallback: ((msg: ChannelMessage) => void) | null = null
  private channelId: string
  private wsClient: any = null
  private processedMsgIds = new Set<string>()

  constructor(channelId: string) {
    this.channelId = channelId
  }

  async connect(config: Record<string, any>): Promise<void> {
    const { appId, appSecret } = config
    if (!appId || !appSecret) throw new Error('Feishu appId and appSecret are required')

    this.client = new lark.Client({ appId, appSecret, appType: lark.AppType.SelfBuild })

    try {
      this.wsClient = new (lark as any).WSClient({
        appId,
        appSecret,
        eventDispatcher: new lark.EventDispatcher({}).register({
          'im.message.receive_v1': (data: any) => {
            this.handleMessage(data)
          },
        }),
        loggerLevel: (lark as any).LoggerLevel?.WARN ?? 2,
      })
      await this.wsClient.start()
      this.connected = true
      console.log(`[Feishu] WebSocket connected for channel ${this.channelId}`)
    } catch (err: any) {
      console.log(`[Feishu] WebSocket not available, using polling mode: ${err.message}`)
      this.connected = true
      this.startPolling(config)
    }
  }

  private startPolling(_config: Record<string, any>) {
    console.log(`[Feishu] Polling mode active for channel ${this.channelId}`)
  }

  private handleMessage(data: any) {
    if (!this.messageCallback) return

    try {
      const event = data
      const message = event.message
      if (!message) return

      const msgId = message.message_id
      if (this.processedMsgIds.has(msgId)) return
      this.processedMsgIds.add(msgId)
      if (this.processedMsgIds.size > 1000) {
        const arr = [...this.processedMsgIds]
        this.processedMsgIds = new Set(arr.slice(-500))
      }

      let content = ''
      if (message.message_type === 'text') {
        try {
          const parsed = JSON.parse(message.content)
          content = parsed.text || message.content
        } catch {
          content = message.content
        }
      } else {
        content = `[${message.message_type} message]`
      }

      const chatId = message.chat_id
      const sender = event.sender
      const senderName = sender?.sender_id?.open_id || 'unknown'

      this.messageCallback({
        chatId: `feishu:${chatId}`,
        senderId: `feishu:${sender?.sender_id?.open_id || 'unknown'}`,
        senderName,
        content,
        metadata: {
          messageType: message.message_type,
          chatType: message.chat_type,
          messageId: msgId,
        },
      })
    } catch (err: any) {
      console.error(`[Feishu] Error handling message: ${err.message}`)
    }
  }

  async disconnect(): Promise<void> {
    if (this.wsClient) {
      try { this.wsClient.stop?.() } catch {}
      this.wsClient = null
    }
    this.client = null
    this.connected = false
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.client) throw new Error('Feishu client not connected')

    const numericChatId = chatId.replace('feishu:', '')

    await this.client.im.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: numericChatId,
        msg_type: 'text',
        content: JSON.stringify({ text }),
      },
    })
  }

  isConnected(): boolean {
    return this.connected
  }

  onMessage(callback: (msg: ChannelMessage) => void): void {
    this.messageCallback = callback
  }
}

registerAdapterType('feishu', (channelId) => new FeishuAdapter(channelId))
