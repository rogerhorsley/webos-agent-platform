import { Bot } from 'grammy'
import { registerAdapterType, type ChannelAdapter, type ChannelMessage } from '../services/channelManager'

class TelegramAdapter implements ChannelAdapter {
  type = 'telegram'
  private bot: Bot | null = null
  private connected = false
  private messageCallback: ((msg: ChannelMessage) => void) | null = null
  private channelId: string

  constructor(channelId: string) {
    this.channelId = channelId
  }

  async connect(config: Record<string, any>): Promise<void> {
    const token = config.botToken || config.token
    if (!token) throw new Error('Telegram bot token is required (config.botToken)')

    this.bot = new Bot(token)

    this.bot.on('message:text', (ctx) => {
      if (!this.messageCallback) return

      const chat = ctx.chat
      const from = ctx.from

      this.messageCallback({
        chatId: `tg:${chat.id}`,
        senderId: from ? `tg:${from.id}` : undefined,
        senderName: from ? (from.first_name + (from.last_name ? ` ${from.last_name}` : '')) : 'Unknown',
        content: ctx.message.text,
        metadata: {
          chatType: chat.type,
          chatTitle: 'title' in chat ? chat.title : undefined,
          messageId: ctx.message.message_id,
          username: from?.username,
        },
      })
    })

    this.bot.catch((err) => {
      console.error(`[Telegram] Bot error: ${err.message}`)
    })

    this.bot.start({
      onStart: () => {
        this.connected = true
        console.log(`[Telegram] Bot started for channel ${this.channelId}`)
      },
    })
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      this.bot.stop()
      this.bot = null
    }
    this.connected = false
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.bot) throw new Error('Telegram bot not connected')

    const numericId = chatId.replace('tg:', '')
    await this.bot.api.sendMessage(Number(numericId), text, { parse_mode: 'Markdown' }).catch(async () => {
      await this.bot!.api.sendMessage(Number(numericId), text)
    })
  }

  isConnected(): boolean {
    return this.connected
  }

  onMessage(callback: (msg: ChannelMessage) => void): void {
    this.messageCallback = callback
  }
}

registerAdapterType('telegram', (channelId) => new TelegramAdapter(channelId))
