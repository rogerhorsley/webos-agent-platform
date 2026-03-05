import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '../lib/api'

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: chatsApi.list,
  })
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatsApi.getMessages(sessionId!),
    enabled: !!sessionId,
  })
}

export function useCreateChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chatsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats'] }),
  })
}

export function useDeleteChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chatsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats'] }),
  })
}

export function useAddChatMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, body }: { sessionId: string; body: { role: string; content: string } }) =>
      chatsApi.addMessage(sessionId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] })
      qc.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}
