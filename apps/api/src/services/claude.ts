import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

export async function streamChat(
  messages: ChatMessage[],
  systemPrompt?: string,
  model = 'claude-sonnet-4-5',
  callbacks?: StreamCallbacks
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    const mock = `[Claude not configured] Received: "${messages[messages.length - 1]?.content}"`
    callbacks?.onToken(mock)
    callbacks?.onDone(mock)
    return mock
  }

  let fullText = ''

  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text
      callbacks?.onToken(event.delta.text)
    }
  }

  callbacks?.onDone(fullText)
  return fullText
}
