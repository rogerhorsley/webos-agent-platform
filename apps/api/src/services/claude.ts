import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
  onToolUse?: (toolUse: ToolUseBlock) => void
}

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250514'

function resolveModel(model?: string): string {
  if (!model) return DEFAULT_MODEL
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-5': 'claude-sonnet-4-5-20250514',
    'claude-opus-4-5': 'claude-opus-4-5-20250514',
    'claude-haiku-4-5': 'claude-haiku-4-5-20250514',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229': 'claude-3-opus-20240229',
  }
  // Strip provider prefix if present
  const bare = model.includes('/') ? model.split('/').pop()! : model
  return modelMap[bare] ?? bare
}

export async function streamChat(
  messages: ChatMessage[],
  systemPrompt?: string,
  model?: string,
  callbacks?: StreamCallbacks,
  signal?: AbortSignal
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    const mock = `[AI not configured] Received: "${messages[messages.length - 1]?.content}"`
    callbacks?.onToken(mock)
    callbacks?.onDone(mock)
    return mock
  }

  let fullText = ''

  try {
    const stream = client.messages.stream(
      {
        model: resolveModel(model),
        max_tokens: 4096,
        system: systemPrompt || undefined,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      },
      { signal }
    )

    stream.on('text', (text) => {
      if (signal?.aborted) return
      fullText += text
      callbacks?.onToken(text)
    })

    stream.on('contentBlock', (block) => {
      if (block.type === 'tool_use') {
        callbacks?.onToolUse?.({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        })
      }
    })

    const finalMessage = await stream.finalMessage()

    // Extract any tool_use blocks from final message
    for (const block of finalMessage.content) {
      if (block.type === 'tool_use') {
        callbacks?.onToolUse?.({
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        })
      }
    }

    callbacks?.onDone(fullText)
    return fullText
  } catch (err: unknown) {
    const error = err as Error & { name?: string }
    if (error.name === 'AbortError' || signal?.aborted) {
      callbacks?.onDone(fullText)
      return fullText
    }
    callbacks?.onError(error)
    throw err
  }
}
