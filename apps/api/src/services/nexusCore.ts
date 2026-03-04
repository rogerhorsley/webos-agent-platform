import { dbGetAll, dbGetOne } from '../db/index'
import { streamChat, type ChatMessage, type StreamCallbacks } from './claude'

export const NEXUS_CORE_ID = 'nexus-core'

export interface DispatchDirective {
  action: 'dispatch'
  mode: 'auto' | 'confirm'
  target: {
    type: 'agent' | 'team'
    id: string
  }
  task: {
    name: string
    prompt: string
    context?: string
  }
  communicationMode?: 'sequential' | 'parallel' | 'hierarchical'
  reason?: string
}

function buildAgentCatalog() {
  const agents = dbGetAll<any>('agents').filter((a) => a.id !== NEXUS_CORE_ID)
  if (!agents.length) return '- (none)'
  return agents.map((a) => `- ${a.id}: ${a.name} (${a.role})`).join('\n')
}

function buildTeamCatalog() {
  const teams = dbGetAll<any>('agent_teams')
  if (!teams.length) return '- (none)'
  return teams
    .map((t) => `- ${t.id}: ${t.name} [${t.communicationMode}] members=${(t.agentIds || []).length}`)
    .join('\n')
}

export function buildNexusCoreSystemPrompt(dispatchMode: 'auto' | 'confirm'): string {
  return [
    'You are NexusCore, the built-in chief assistant for a multi-agent OS.',
    'Primary duties:',
    '1) Answer directly when user asks simple/general questions.',
    '2) Dispatch to a specialist agent or team for complex execution tasks.',
    '',
    `Dispatch mode is: ${dispatchMode}.`,
    `- If mode=auto, include dispatch directive when execution should start immediately.`,
    `- If mode=confirm, include dispatch directive as a proposal (frontend asks confirmation).`,
    '',
    'Available agents:',
    buildAgentCatalog(),
    '',
    'Available teams:',
    buildTeamCatalog(),
    '',
    'When dispatching, append EXACTLY one JSON block wrapped by <dispatch></dispatch>.',
    'Schema:',
    '{"action":"dispatch","mode":"auto|confirm","target":{"type":"agent|team","id":"..."},"task":{"name":"...","prompt":"...","context":"..."},"communicationMode":"sequential|parallel|hierarchical","reason":"..."}',
    '',
    'If no dispatch needed, do NOT output <dispatch> block.',
  ].join('\n')
}

function tryParseJson(raw: string): any | null {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function extractDispatchDirective(content: string): DispatchDirective | null {
  const tagMatch = content.match(/<dispatch>([\s\S]*?)<\/dispatch>/i)
  if (tagMatch) {
    const parsed = tryParseJson(tagMatch[1].trim())
    if (parsed?.action === 'dispatch') return parsed as DispatchDirective
  }

  const codeblock = content.match(/```json\s*([\s\S]*?)```/i)
  if (codeblock) {
    const parsed = tryParseJson(codeblock[1].trim())
    if (parsed?.action === 'dispatch') return parsed as DispatchDirective
  }

  return null
}

function stripDispatchBlock(content: string): string {
  return content
    .replace(/<dispatch>[\s\S]*?<\/dispatch>/gi, '')
    .trim()
}

export async function handleNexusCoreChat(params: {
  messages: ChatMessage[]
  model?: string
  dispatchMode: 'auto' | 'confirm'
  callbacks?: StreamCallbacks
  signal?: AbortSignal
}): Promise<{ content: string; dispatch: DispatchDirective | null }> {
  const fullText = await streamChat(
    params.messages,
    buildNexusCoreSystemPrompt(params.dispatchMode),
    params.model,
    params.callbacks,
    params.signal
  )

  return {
    content: stripDispatchBlock(fullText),
    dispatch: extractDispatchDirective(fullText),
  }
}

export function getNexusCoreAgent() {
  return dbGetOne<any>('agents', NEXUS_CORE_ID)
}

