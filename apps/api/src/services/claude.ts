import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://nexusos.app',
    'X-Title': 'NexusOS',
  },
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

// OpenRouter model name for Claude
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5'

function resolveModel(model?: string): string {
  if (!model) return DEFAULT_MODEL
  // If already has a provider prefix (e.g. "anthropic/..."), use as-is
  if (model.includes('/')) return model
  // Map bare Claude model names to OpenRouter format
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-5': 'anthropic/claude-sonnet-4-5',
    'claude-opus-4-5': 'anthropic/claude-opus-4-5',
    'claude-haiku-3-5': 'anthropic/claude-haiku-3-5',
    'claude-3-5-sonnet-20241022': 'anthropic/claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022': 'anthropic/claude-3-5-haiku-20241022',
    'claude-3-opus-20240229': 'anthropic/claude-3-opus-20240229',
  }
  return modelMap[model] ?? `anthropic/${model}`
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
    const systemMessages: OpenAI.Chat.ChatCompletionMessageParam[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }]
      : []

    const stream = await client.chat.completions.create(
      {
        model: resolveModel(model),
        max_tokens: 4096,
        messages: [
          ...systemMessages,
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        stream: true,
      },
      { signal }
    )

    for await (const chunk of stream) {
      if (signal?.aborted) break
      const token = chunk.choices[0]?.delta?.content ?? ''
      if (token) {
        fullText += token
        callbacks?.onToken(token)
      }
    }

    callbacks?.onDone(fullText)
    return fullText
  } catch (err: any) {
    // AbortError is intentional — treat as normal "done"
    if (err.name === 'AbortError' || signal?.aborted) {
      callbacks?.onDone(fullText)
      return fullText
    }
    callbacks?.onError(err)
    throw err
  }
}
