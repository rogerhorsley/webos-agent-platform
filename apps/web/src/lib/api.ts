const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Agents
export const agentsApi = {
  list: () => request<any[]>('/api/agents'),
  get: (id: string) => request<any>(`/api/agents/${id}`),
  create: (body: any) => request<any>('/api/agents', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<any>(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/api/agents/${id}`, { method: 'DELETE' }),
  listTemplates: () => request<any[]>('/api/agents/templates'),
  installTemplate: (slug: string) => request<any>(`/api/agents/templates/${slug}/install`, { method: 'POST' }),
}

// Sandbox
export const sandboxApi = {
  status: () => request<any>('/api/sandbox/status'),
  containers: () => request<any[]>('/api/sandbox/containers'),
  containerInfo: (agentId: string) => request<any>(`/api/sandbox/containers/${agentId}`),
  start: (agentId: string) => request<any>(`/api/sandbox/containers/${agentId}/start`, { method: 'POST' }),
  stop: (agentId: string) => request<any>(`/api/sandbox/containers/${agentId}/stop`, { method: 'POST' }),
  restart: (agentId: string) => request<any>(`/api/sandbox/containers/${agentId}/restart`, { method: 'POST' }),
  remove: (agentId: string) => request<void>(`/api/sandbox/containers/${agentId}`, { method: 'DELETE' }),
  exec: (agentId: string, command: string, timeout?: number) =>
    request<any>(`/api/sandbox/containers/${agentId}/exec`, { method: 'POST', body: JSON.stringify({ command, timeout }) }),
}

// Tasks
export const tasksApi = {
  list: (status?: string) => request<any[]>(`/api/tasks${status ? `?status=${status}` : ''}`),
  get: (id: string) => request<any>(`/api/tasks/${id}`),
  create: (body: any) => request<any>('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
  start: (id: string) => request<any>(`/api/tasks/${id}/start`, { method: 'POST' }),
  cancel: (id: string) => request<any>(`/api/tasks/${id}/cancel`, { method: 'POST' }),
  delete: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
}

// Teams
export const teamsApi = {
  list: () => request<any[]>('/api/teams'),
  get: (id: string) => request<any>(`/api/teams/${id}`),
  create: (body: any) => request<any>('/api/teams', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<any>(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/api/teams/${id}`, { method: 'DELETE' }),
  run: (id: string, body: { prompt: string; name?: string; priority?: string }) =>
    request<any>(`/api/teams/${id}/run`, { method: 'POST', body: JSON.stringify(body) }),
}

// Skills
export const skillsApi = {
  list: () => request<any[]>('/api/skills'),
  get: (slug: string) => request<any>(`/api/skills/${slug}`),
  install: (slug: string) => request<any>(`/api/skills/${slug}/install`, { method: 'POST' }),
  uninstall: (slug: string) => request<void>(`/api/skills/${slug}`, { method: 'DELETE' }),
  listChains: () => request<any[]>('/api/skills/chains'),
  createChain: (body: any) => request<any>('/api/skills/chains', { method: 'POST', body: JSON.stringify(body) }),
  deleteChain: (id: string) => request<void>(`/api/skills/chains/${id}`, { method: 'DELETE' }),
  runChain: (id: string, input: string) =>
    request<any>(`/api/skills/chains/${id}/run`, { method: 'POST', body: JSON.stringify({ input }) }),
}

// Prompts
export const promptsApi = {
  list: () => request<any[]>('/api/prompts'),
  get: (id: string) => request<any>(`/api/prompts/${id}`),
  create: (body: any) => request<any>('/api/prompts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<any>(`/api/prompts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/api/prompts/${id}`, { method: 'DELETE' }),
  render: (id: string, variables: Record<string, any>) =>
    request<{ rendered: string; system?: string }>(`/api/prompts/${id}/render`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    }),
}

// Workflows
export const workflowsApi = {
  list: () => request<any[]>('/api/workflows'),
  get: (id: string) => request<any>(`/api/workflows/${id}`),
  create: (body: any) => request<any>('/api/workflows', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<any>(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/api/workflows/${id}`, { method: 'DELETE' }),
  run: (id: string, body?: any) => request<any>(`/api/workflows/${id}/run`, { method: 'POST', body: JSON.stringify(body || {}) }),
}

// Channels
export const channelsApi = {
  list: () => request<any[]>('/api/channels'),
  get: (id: string) => request<any>(`/api/channels/${id}`),
  create: (body: any) => request<any>('/api/channels', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<any>(`/api/channels/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/api/channels/${id}`, { method: 'DELETE' }),
  connect: (id: string) => request<any>(`/api/channels/${id}/connect`, { method: 'POST' }),
  disconnect: (id: string) => request<any>(`/api/channels/${id}/disconnect`, { method: 'POST' }),
  send: (id: string, chatId: string, text: string) =>
    request<any>(`/api/channels/${id}/send`, { method: 'POST', body: JSON.stringify({ chatId, text }) }),
  messages: (id: string, chatId?: string) =>
    request<any[]>(`/api/channels/${id}/messages${chatId ? `?chatId=${chatId}` : ''}`),
  stats: () => request<any>('/api/channels/stats'),
}

// Scheduled Tasks
export const scheduledTasksApi = {
  list: () => request<any[]>('/api/scheduled-tasks'),
  get: (id: string) => request<any>(`/api/scheduled-tasks/${id}`),
  create: (body: any) => request<any>('/api/scheduled-tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<any>(`/api/scheduled-tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  pause: (id: string) => request<any>(`/api/scheduled-tasks/${id}/pause`, { method: 'POST' }),
  resume: (id: string) => request<any>(`/api/scheduled-tasks/${id}/resume`, { method: 'POST' }),
  delete: (id: string) => request<void>(`/api/scheduled-tasks/${id}`, { method: 'DELETE' }),
}

// MCP
export const mcpApi = {
  listServers: () => request<any[]>('/api/mcp/servers'),
  createServer: (body: any) => request<any>('/api/mcp/servers', { method: 'POST', body: JSON.stringify(body) }),
  deleteServer: (id: string) => request<void>(`/api/mcp/servers/${id}`, { method: 'DELETE' }),
  callTool: (name: string, args: any) =>
    request<any>(`/api/mcp/tools/${name}/call`, { method: 'POST', body: JSON.stringify({ args }) }),
}
