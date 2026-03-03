import { z } from 'zod'

export const TaskStatusSchema = z.enum([
  'pending',
  'queued',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskTypeSchema = z.enum(['chat', 'workflow', 'batch'])
export type TaskType = z.infer<typeof TaskTypeSchema>

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: TaskTypeSchema,
  status: TaskStatusSchema.default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  agentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  input: z.object({
    prompt: z.string(),
    context: z.any().optional(),
    files: z.array(z.string()).optional(),
  }),
  output: z.object({
    result: z.any().optional(),
    artifacts: z.array(z.any()).optional(),
    logs: z.array(z.any()).optional(),
  }).optional(),
  progress: z.object({
    current: z.number(),
    total: z.number(),
  }).default({ current: 0, total: 100 }),
  parentTaskId: z.string().uuid().optional(),
  childTaskIds: z.array(z.string().uuid()).default([]),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
})
export type Task = z.infer<typeof TaskSchema>
