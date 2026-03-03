import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../lib/api'

export function useTasks(status?: string) {
  return useQuery({
    queryKey: ['tasks', status],
    queryFn: () => tasksApi.list(status),
    refetchInterval: 3000,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useStartTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.start,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useCancelTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
