import { useCallback, useState } from 'react'
import {
  ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge,
  Connection, Edge, Node, BackgroundVariant, Handle, Position, NodeProps, Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Zap, Bot, GitBranch, Wrench, ChevronDown, Save, Play, Loader2, X, Trash2, List } from 'lucide-react'
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow } from '../../hooks/useWorkflows'

// Node styles — 精确协议配色
const NODE_STYLES = {
  trigger:   { border: 'rgba(232,76,106,0.6)',  bg: 'rgba(232,76,106,0.12)',  text: '#E84C6A' },
  agent:     { border: 'rgba(96,165,250,0.5)',  bg: 'rgba(96,165,250,0.10)',  text: '#60A5FA' },
  condition: { border: 'rgba(251,191,36,0.5)',  bg: 'rgba(251,191,36,0.10)',  text: '#FBBF24' },
  tool:      { border: 'rgba(167,139,250,0.5)', bg: 'rgba(167,139,250,0.10)', text: '#A78BFA' },
  output:    { border: 'rgba(74,222,128,0.5)',  bg: 'rgba(74,222,128,0.10)',  text: '#4ADE80' },
}

function NodeWrapper({ type, label, children, selected }: { type: string; label: string; children?: React.ReactNode; selected?: boolean }) {
  const s = NODE_STYLES[type as keyof typeof NODE_STYLES] || NODE_STYLES.tool
  return (
    <div style={{
      padding: '8px 12px', borderRadius: '8px', minWidth: '120px',
      background: s.bg, border: `1px solid ${selected ? s.border.replace('0.5', '1') : s.border}`,
      boxShadow: selected ? `0 0 0 1px ${s.text}30` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#FAFAFA' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function TriggerNode({ data, selected }: NodeProps) {
  return <NodeWrapper type="trigger" label={String(data.label)} selected={selected}>
    <Handle type="source" position={Position.Bottom} style={{ background: '#E84C6A', border: 'none', width: 8, height: 8 }} />
  </NodeWrapper>
}
function AgentNode({ data, selected }: NodeProps) {
  return <NodeWrapper type="agent" label={String(data.label)} selected={selected}>
    <Handle type="target" position={Position.Top} style={{ background: '#60A5FA', border: 'none', width: 8, height: 8 }} />
    <Handle type="source" position={Position.Bottom} style={{ background: '#60A5FA', border: 'none', width: 8, height: 8 }} />
  </NodeWrapper>
}
function ConditionNode({ data, selected }: NodeProps) {
  return <NodeWrapper type="condition" label={String(data.label)} selected={selected}>
    <Handle type="target" position={Position.Top} style={{ background: '#FBBF24', border: 'none', width: 8, height: 8 }} />
    <Handle type="source" id="yes" position={Position.Bottom} style={{ background: '#4ADE80', border: 'none', width: 8, height: 8, left: '30%' }} />
    <Handle type="source" id="no" position={Position.Bottom} style={{ background: '#F87171', border: 'none', width: 8, height: 8, left: '70%' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: 4, paddingLeft: 2, paddingRight: 2, opacity: 0.7 }}>
      <span style={{ color: '#4ADE80' }}>Yes</span><span style={{ color: '#F87171' }}>No</span>
    </div>
  </NodeWrapper>
}
function ToolNode({ data, selected }: NodeProps) {
  return <NodeWrapper type="tool" label={String(data.label)} selected={selected}>
    <Handle type="target" position={Position.Top} style={{ background: '#A78BFA', border: 'none', width: 8, height: 8 }} />
    <Handle type="source" position={Position.Bottom} style={{ background: '#A78BFA', border: 'none', width: 8, height: 8 }} />
  </NodeWrapper>
}
function OutputNode({ data, selected }: NodeProps) {
  return <NodeWrapper type="output" label={String(data.label)} selected={selected}>
    <Handle type="target" position={Position.Top} style={{ background: '#4ADE80', border: 'none', width: 8, height: 8 }} />
  </NodeWrapper>
}

const nodeTypes = { trigger: TriggerNode, agent: AgentNode, condition: ConditionNode, tool: ToolNode, output: OutputNode }

const initialNodes: Node[] = [
  { id: 'trigger-1', type: 'trigger', data: { label: 'Manual Trigger' }, position: { x: 250, y: 30 } },
  { id: 'agent-1',   type: 'agent',   data: { label: 'Agent Task' },     position: { x: 220, y: 130 } },
  { id: 'cond-1',    type: 'condition', data: { label: 'Success?' },     position: { x: 220, y: 240 } },
  { id: 'tool-1',    type: 'tool',    data: { label: 'Write Output' },   position: { x: 80,  y: 360 } },
  { id: 'tool-2',    type: 'tool',    data: { label: 'Notify Error' },   position: { x: 360, y: 360 } },
  { id: 'output-1',  type: 'output',  data: { label: 'Done' },           position: { x: 220, y: 470 } },
]
const initialEdges: Edge[] = [
  { id: 'e1', source: 'trigger-1', target: 'agent-1', animated: true, style: { stroke: '#E84C6A', strokeWidth: 1.5 } },
  { id: 'e2', source: 'agent-1', target: 'cond-1', style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5 } },
  { id: 'e3', source: 'cond-1', sourceHandle: 'yes', target: 'tool-1', label: 'Yes', style: { stroke: '#4ADE80', strokeWidth: 1.5 } },
  { id: 'e4', source: 'cond-1', sourceHandle: 'no',  target: 'tool-2', label: 'No',  style: { stroke: '#F87171', strokeWidth: 1.5 } },
  { id: 'e5', source: 'tool-1', target: 'output-1', style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5 } },
  { id: 'e6', source: 'tool-2', target: 'output-1', style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5 } },
]

let nodeCounter = 100
const PALETTE = [
  { type: 'trigger',   label: 'Trigger',   color: '#E84C6A' },
  { type: 'agent',     label: 'Agent',     color: '#60A5FA' },
  { type: 'condition', label: 'Condition', color: '#FBBF24' },
  { type: 'tool',      label: 'Tool',      color: '#A78BFA' },
  { type: 'output',    label: 'Output',    color: '#4ADE80' },
]

export function CanvasApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)
  const { data: workflows = [] } = useWorkflows()
  const createWorkflow = useCreateWorkflow()
  const updateWorkflow = useUpdateWorkflow()

  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge({ ...params, style: { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5 } }, eds)), [setEdges])
  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), [])
  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  const addNode = (type: string) => {
    setNodes(ns => [...ns, {
      id: `${type}-${++nodeCounter}`, type,
      data: { label: PALETTE.find(p => p.type === type)?.label || type },
      position: { x: 150 + Math.random() * 200, y: 150 + Math.random() * 100 },
    }])
  }

  const handleSave = async () => {
    const payload = { name: workflowName, nodes: nodes as any[], edges: edges as any[] }
    if (currentWorkflowId) { await updateWorkflow.mutateAsync({ id: currentWorkflowId, ...payload }) }
    else { const r = await createWorkflow.mutateAsync(payload); setCurrentWorkflowId(r.id) }
  }

  const isSaving = createWorkflow.isPending || updateWorkflow.isPending

  return (
    <div className="h-full w-full flex">
      {/* Left palette */}
      <div className="w-40 flex-shrink-0 flex flex-col" style={{ background: 'rgba(12,12,14,0.8)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-ink-4 text-[10px] font-medium uppercase tracking-widest">Add Node</p>
        </div>
        <div className="flex-1 p-2 space-y-1 overflow-auto">
          {PALETTE.map(item => (
            <button key={item.type} onClick={() => addNode(item.type)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-ink-2 text-xs">{item.label}</span>
            </button>
          ))}
        </div>
        {workflows.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-2">
            <button onClick={() => setShowList(!showList)} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-ink-4 hover:text-ink-2 text-xs transition-colors">
              <List className="w-3 h-3" /> Saved ({workflows.length})
            </button>
            {showList && workflows.map((wf: any) => (
              <button key={wf.id} onClick={() => { setNodes(wf.nodes || []); setEdges(wf.edges || []); setWorkflowName(wf.name); setCurrentWorkflowId(wf.id); setShowList(false) }}
                className="w-full text-left px-2 py-1 rounded text-ink-4 hover:text-ink-2 text-xs truncate transition-colors">
                {wf.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
          nodeTypes={nodeTypes} fitView deleteKeyCode="Delete"
          style={{ background: '#0C0C0E' }}
        >
          <Controls style={{ background: '#1C1C1F', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'none' }} />
          <MiniMap style={{ background: '#1C1C1F', border: '1px solid rgba(255,255,255,0.06)' }}
            nodeColor={(n) => ({ trigger: '#E84C6A', agent: '#60A5FA', condition: '#FBBF24', tool: '#A78BFA', output: '#4ADE80' }[n.type || ''] || '#52525B')}
            maskColor="rgba(12,12,14,0.7)"
          />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
          <Panel position="top-right">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#1C1C1F', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input value={workflowName} onChange={e => setWorkflowName(e.target.value)}
                className="bg-transparent text-ink-1 text-xs w-32 focus:outline-none" />
              <button onClick={handleSave} disabled={isSaving} className="btn-primary py-1 px-2.5 text-xs">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-state-success text-xs" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <Play className="w-3 h-3" /> Run
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right property panel */}
      {selectedNode && (
        <div className="w-52 flex-shrink-0 flex flex-col" style={{ background: 'rgba(12,12,14,0.8)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-ink-3 text-xs font-medium capitalize">{selectedNode.type}</p>
            <button onClick={() => setSelectedNode(null)} className="p-0.5 hover:bg-white/5 rounded">
              <X className="w-3.5 h-3.5 text-ink-4" />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-3">
            <div>
              <label className="text-ink-4 text-[11px] mb-1 block">Label</label>
              <input value={String(selectedNode.data.label)}
                onChange={e => { setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n)); setSelectedNode(p => p ? { ...p, data: { ...p.data, label: e.target.value } } : p) }}
                className="app-input text-xs py-1.5" />
            </div>
            <div>
              <p className="text-ink-4 text-[11px] mb-1">Node ID</p>
              <p className="text-ink-3 text-[11px] font-mono">{selectedNode.id}</p>
            </div>
          </div>
          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => { setNodes(ns => ns.filter(n => n.id !== selectedNode.id)); setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id)); setSelectedNode(null) }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-state-error text-xs transition-colors"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
              <Trash2 className="w-3 h-3" /> Delete Node
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
