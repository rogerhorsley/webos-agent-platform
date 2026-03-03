import { z } from 'zod'

export const MCPTransportSchema = z.enum(['stdio', 'sse', 'websocket'])
export type MCPTransport = z.infer<typeof MCPTransportSchema>

export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.any(),
  annotations: z.object({
    title: z.string().optional(),
    readOnlyHint: z.boolean().optional(),
    destructiveHint: z.boolean().optional(),
    idempotentHint: z.boolean().optional(),
    openWorldHint: z.boolean().optional(),
  }).optional(),
})
export type MCPTool = z.infer<typeof MCPToolSchema>

export const MCPServerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  transport: MCPTransportSchema,
  command: z.string().optional(),
  url: z.string().optional(),
  env: z.record(z.string()).optional(),
  tools: z.array(MCPToolSchema).default([]),
  resources: z.array(z.any()).default([]),
  prompts: z.array(z.any()).default([]),
  status: z.enum(['active', 'inactive', 'error']).default('inactive'),
  healthCheck: z.object({
    lastCheck: z.string().datetime().optional(),
    healthy: z.boolean(),
    error: z.string().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type MCPServer = z.infer<typeof MCPServerSchema>
