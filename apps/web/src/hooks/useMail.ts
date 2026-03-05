import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mailApi } from '../lib/api'

export function useMailAccounts() {
  return useQuery({
    queryKey: ['mail', 'accounts'],
    queryFn: mailApi.listAccounts,
  })
}

export function useCreateMailAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mailApi.createAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mail', 'accounts'] }),
  })
}

export function useDeleteMailAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mailApi.deleteAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mail', 'accounts'] }),
  })
}

export function useMailMessages(accountId: string | null, folder?: string) {
  return useQuery({
    queryKey: ['mail', 'messages', accountId, folder],
    queryFn: () => mailApi.listMessages(accountId!, folder),
    enabled: !!accountId,
  })
}

export function useFetchInbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, limit }: { accountId: string; limit?: number }) =>
      mailApi.fetchInbox(accountId, limit),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['mail', 'messages', variables.accountId] }),
  })
}

export function useGetMessageBody() {
  return useMutation({
    mutationFn: mailApi.getMessageBody,
  })
}

export function useSendMail() {
  return useMutation({
    mutationFn: ({ accountId, ...body }: { accountId: string; to: string; subject: string; body: string }) =>
      mailApi.sendMail(accountId, body),
  })
}

export function useMarkMailRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mailApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mail', 'messages'] }),
  })
}

export function useDeleteMailMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: mailApi.deleteMessage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mail', 'messages'] }),
  })
}
