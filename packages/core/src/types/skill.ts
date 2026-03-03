import { z } from 'zod'

export const SkillCategorySchema = z.enum([
  'development',
  'design',
  'writing',
  'research',
  'data',
  'automation',
  'communication',
  'custom',
])
export type SkillCategory = z.infer<typeof SkillCategorySchema>

export const SkillSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  version: z.string(),
  description: z.string().optional(),
  author: z.string(),
  category: SkillCategorySchema,
  triggers: z.object({
    commands: z.array(z.string()).optional(),
    patterns: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  content: z.object({
    systemPrompt: z.string().optional(),
    instructions: z.string(),
    examples: z.array(z.any()).optional(),
  }),
  dependencies: z.object({
    skills: z.array(z.string()).optional(),
    mcpServers: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.object({
    icon: z.string().optional(),
    tags: z.array(z.string()).default([]),
    downloads: z.number().default(0),
    rating: z.number().default(0),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Skill = z.infer<typeof SkillSchema>
