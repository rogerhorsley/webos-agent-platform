import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptsApi } from '../lib/api'

export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: promptsApi.list,
  })
}

export function useCreatePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: promptsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompts'] }),
  })
}

export function useUpdatePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: any) => promptsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompts'] }),
  })
}

export function useDeletePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: promptsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prompts'] }),
  })
}

export function useRenderPrompt() {
  return useMutation({
    mutationFn: ({ id, variables }: { id: string; variables: Record<string, any> }) =>
      promptsApi.render(id, variables),
  })
}
