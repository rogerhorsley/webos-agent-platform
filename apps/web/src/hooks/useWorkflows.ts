import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowsApi } from '../lib/api'

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.list,
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => workflowsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: any) => workflowsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useRunWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.run,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}
