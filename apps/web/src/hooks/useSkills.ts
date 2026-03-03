import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsApi } from '../lib/api'

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.list,
  })
}

export function useInstallSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: skillsApi.install,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}

export function useUninstallSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: skillsApi.uninstall,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}
