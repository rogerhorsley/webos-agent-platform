import { z } from 'zod'

export const AgentRoleSchema = z.enum(['developer', 'designer', 'researcher', 'coordinator', 'custom'])
export type AgentRole = z.infer<typeof AgentRoleSchema>

export const AgentStatusSchema = z.enum(['idle', 'running', 'error'])
export type AgentStatus = z.infer<typeof AgentStatusSchema>

export const AgentConfigSchema = z.object({
  model: z.string().default('claude-sonnet-4-5'),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().default(4096),
  timeout: z.number().default(300000),
})
export type AgentConfig = z.infer<typeof AgentConfigSchema>

export const AgentSchema = z.object({
  // Supports built-in system agents like "nexus-core"
  id: z.string().min(1),
  name: z.string().min(1),
  role: AgentRoleSchema,
  systemPrompt: z.string().optional(),
  config: AgentConfigSchema.optional(),
  skills: z.array(z.string()).default([]),
  mcpServers: z.array(z.string()).default([]),
  status: AgentStatusSchema.default('idle'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Agent = z.infer<typeof AgentSchema>

export const AgentTeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  agentIds: z.array(z.string().min(1)).default([]),
  agents: z.array(AgentSchema).optional(),
  coordinatorId: z.string().min(1).optional(),
  communicationMode: z.enum(['sequential', 'parallel', 'hierarchical']).default('sequential'),
  sharedContext: z.boolean().default(true),
  config: z.record(z.any()).optional(),
  status: z.enum(['idle', 'running', 'error']).default('idle'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type AgentTeam = z.infer<typeof AgentTeamSchema>
