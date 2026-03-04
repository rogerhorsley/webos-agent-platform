import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../lib/api'

export function useNotes(agentId?: string) {
  return useQuery({
    queryKey: ['notes', agentId],
    queryFn: () => notesApi.list(agentId),
  })
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: ['notes', 'detail', id],
    queryFn: () => notesApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) => notesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })
}
