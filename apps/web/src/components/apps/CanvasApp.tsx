import { useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    data: { label: 'Trigger: Manual' },
    position: { x: 250, y: 0 },
    style: { background: '#e94560', color: 'white', border: 'none' },
  },
  {
    id: 'agent-1',
    data: { label: 'Agent: Developer' },
    position: { x: 250, y: 100 },
    style: { background: '#0f3460', color: 'white', border: '1px solid #e94560' },
  },
  {
    id: 'condition-1',
    data: { label: 'Condition: Success?' },
    position: { x: 250, y: 200 },
    style: { background: '#16213e', color: 'white', border: '1px solid #e94560' },
  },
  {
    id: 'tool-1',
    data: { label: 'Tool: Write File' },
    position: { x: 100, y: 300 },
    style: { background: '#0f3460', color: 'white', border: '1px solid #16213e' },
  },
  {
    id: 'tool-2',
    data: { label: 'Tool: Send Message' },
    position: { x: 400, y: 300 },
    style: { background: '#0f3460', color: 'white', border: '1px solid #16213e' },
  },
  {
    id: 'output-1',
    type: 'output',
    data: { label: 'Output: Complete' },
    position: { x: 250, y: 400 },
    style: { background: '#e94560', color: 'white', border: 'none' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'trigger-1', target: 'agent-1', animated: true },
  { id: 'e2-3', source: 'agent-1', target: 'condition-1' },
  { id: 'e3-4', source: 'condition-1', target: 'tool-1', label: 'Yes' },
  { id: 'e3-5', source: 'condition-1', target: 'tool-2', label: 'No' },
  { id: 'e4-6', source: 'tool-1', target: 'output-1' },
  { id: 'e5-6', source: 'tool-2', target: 'output-1' },
]

export function CanvasApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        style={{ background: '#1a1a2e' }}
      >
        <Controls
          style={{ background: '#16213e', border: '1px solid #ffffff20' }}
        />
        <MiniMap
          style={{ background: '#16213e', border: '1px solid #ffffff20' }}
          nodeColor="#e94560"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#ffffff10"
        />
      </ReactFlow>
    </div>
  )
}
