import { z } from 'zod'

export const PromptVariableSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string().optional(),
  required: z.boolean().default(true),
  default: z.any().optional(),
  validation: z.object({
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    enum: z.array(z.any()).optional(),
  }).optional(),
})
export type PromptVariable = z.infer<typeof PromptVariableSchema>

export const PromptTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  template: z.object({
    system: z.string().optional(),
    user: z.string(),
    assistant: z.string().optional(),
  }),
  variables: z.array(PromptVariableSchema).default([]),
  version: z.string().default('1.0.0'),
  stats: z.object({
    useCount: z.number().default(0),
    avgRating: z.number().default(0),
    lastUsed: z.string().datetime().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>
