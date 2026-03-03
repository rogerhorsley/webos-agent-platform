import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
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

const workspacesApi = {
  list: () => req<any[]>('/api/workspaces'),
  get: (id: string) => req<any>(`/api/workspaces/${id}`),
  create: (agentId: string, agentName: string) =>
    req<any>(`/api/workspaces/${agentId}`, { method: 'POST', body: JSON.stringify({ agentName }) }),
  delete: (agentId: string) => req<void>(`/api/workspaces/${agentId}`, { method: 'DELETE' }),
  listFiles: (agentId: string, path = '') =>
    req<any[]>(`/api/workspaces/${agentId}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  readFile: (agentId: string, filePath: string) =>
    fetch(`${API_BASE}/api/workspaces/${agentId}/files/${filePath}`).then(r => r.text()),
  writeFile: (agentId: string, filePath: string, content: string) =>
    req<any>(`/api/workspaces/${agentId}/files/${filePath}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  deleteFile: (agentId: string, filePath: string) =>
    req<void>(`/api/workspaces/${agentId}/files/${filePath}`, { method: 'DELETE' }),
  exec: (agentId: string, command: string, timeout?: number) =>
    req<any>(`/api/workspaces/${agentId}/exec`, { method: 'POST', body: JSON.stringify({ command, timeout }) }),
  runClaude: (agentId: string, task: string, timeout?: number) =>
    req<any>(`/api/workspaces/${agentId}/claude`, { method: 'POST', body: JSON.stringify({ task, timeout }) }),
  sandboxInfo: () => req<any>('/api/workspaces/sandbox'),
}

export function useWorkspacesList() {
  return useQuery({ queryKey: ['workspaces'], queryFn: workspacesApi.list, refetchInterval: 5000 })
}

export function useWorkspaceFiles(agentId: string, path = '') {
  return useQuery({
    queryKey: ['workspace-files', agentId, path],
    queryFn: () => workspacesApi.listFiles(agentId, path),
    enabled: !!agentId,
  })
}

export function useWorkspaceFile(agentId: string, filePath: string) {
  return useQuery({
    queryKey: ['workspace-file', agentId, filePath],
    queryFn: () => workspacesApi.readFile(agentId, filePath),
    enabled: !!agentId && !!filePath,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, agentName }: { agentId: string; agentName: string }) =>
      workspacesApi.create(agentId, agentName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useExecInWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, command, timeout }: { agentId: string; command: string; timeout?: number }) =>
      workspacesApi.exec(agentId, command, timeout),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workspace-files', vars.agentId] }),
  })
}

export function useRunClaude() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, task, timeout }: { agentId: string; task: string; timeout?: number }) =>
      workspacesApi.runClaude(agentId, task, timeout),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workspace-files', vars.agentId] }),
  })
}

export function useWriteWorkspaceFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, filePath, content }: { agentId: string; filePath: string; content: string }) =>
      workspacesApi.writeFile(agentId, filePath, content),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workspace-files', vars.agentId] }),
  })
}

export function useDeleteWorkspaceFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ agentId, filePath }: { agentId: string; filePath: string }) =>
      workspacesApi.deleteFile(agentId, filePath),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workspace-files', vars.agentId] }),
  })
}

export function useSandboxInfo() {
  return useQuery({ queryKey: ['sandbox-info'], queryFn: workspacesApi.sandboxInfo })
}
