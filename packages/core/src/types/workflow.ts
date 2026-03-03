import { z } from 'zod'

export const NodeTypeSchema = z.enum([
  'trigger_manual',
  'trigger_schedule',
  'trigger_webhook',
  'agent_single',
  'agent_team',
  'tool_mcp',
  'tool_builtin',
  'control_condition',
  'control_loop',
  'control_parallel',
  'control_merge',
  'data_input',
  'data_output',
  'data_transform',
  'output_message',
  'output_file',
  'output_webhook',
])
export type NodeType = z.infer<typeof NodeTypeSchema>

export const CanvasNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    config: z.any().optional(),
    inputs: z.array(z.any()).optional(),
    outputs: z.array(z.any()).optional(),
  }),
})
export type CanvasNode = z.infer<typeof CanvasNodeSchema>

export const CanvasEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().optional(),
  target: z.string(),
  targetHandle: z.string().optional(),
  data: z.object({
    condition: z.string().optional(),
    transform: z.string().optional(),
  }).optional(),
})
export type CanvasEdge = z.infer<typeof CanvasEdgeSchema>

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(CanvasNodeSchema),
  edges: z.array(CanvasEdgeSchema),
  variables: z.record(z.any()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Workflow = z.infer<typeof WorkflowSchema>
