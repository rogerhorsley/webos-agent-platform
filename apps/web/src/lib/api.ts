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

// Skills
export const skillsApi = {
  list: () => request<any[]>('/api/skills'),
  get: (slug: string) => request<any>(`/api/skills/${slug}`),
  install: (slug: string) => request<any>(`/api/skills/${slug}/install`, { method: 'POST' }),
  uninstall: (slug: string) => request<void>(`/api/skills/${slug}`, { method: 'DELETE' }),
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
  run: (id: string) => request<any>(`/api/workflows/${id}/run`, { method: 'POST' }),
}

// MCP
export const mcpApi = {
  listServers: () => request<any[]>('/api/mcp/servers'),
  createServer: (body: any) => request<any>('/api/mcp/servers', { method: 'POST', body: JSON.stringify(body) }),
  deleteServer: (id: string) => request<void>(`/api/mcp/servers/${id}`, { method: 'DELETE' }),
  callTool: (name: string, args: any) =>
    request<any>(`/api/mcp/tools/${name}/call`, { method: 'POST', body: JSON.stringify({ args }) }),
}
