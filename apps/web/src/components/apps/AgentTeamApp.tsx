import { useState } from 'react'
import { Plus, Bot, Settings } from 'lucide-react'

interface Agent {
  id: string
  name: string
  role: string
  status: 'idle' | 'running' | 'error'
}

const mockAgents: Agent[] = [
  { id: '1', name: 'Developer', role: 'developer', status: 'idle' },
  { id: '2', name: 'Designer', role: 'designer', status: 'idle' },
  { id: '3', name: 'Researcher', role: 'researcher', status: 'running' },
]

export function AgentTeamApp() {
  const [agents] = useState<Agent[]>(mockAgents)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-semibold">Agent Team</h2>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-desktop-accent rounded-lg text-white text-sm hover:bg-desktop-accent/80">
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-4">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-desktop-accent/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-desktop-accent" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{agent.name}</h3>
                  <p className="text-white/50 text-sm">{agent.role}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  agent.status === 'running'
                    ? 'bg-green-500/20 text-green-400'
                    : agent.status === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {agent.status}
                </span>
                <button className="p-1 hover:bg-white/10 rounded">
                  <Settings className="w-4 h-4 text-white/50" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
