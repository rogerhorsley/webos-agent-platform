import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from '../lib/api'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.list,
    refetchInterval: 5000,
  })
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: any) => teamsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  })
}

export function useRunTeam() {
  return useMutation({
    mutationFn: ({ id, ...body }: any) => teamsApi.run(id, body),
  })
}

