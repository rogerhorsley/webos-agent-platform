import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsApi } from '../lib/api'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => agentsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}

export function useUpdateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: any) => agentsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}

export function useDeleteAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })
}
