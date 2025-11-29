import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

// Types
export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolsUsed: string[]
  analysis?: Record<string, unknown>
  actions?: Record<string, unknown>
  tokenCount?: number
  modelId?: string
  createdAt: string
}

export interface ChatSession {
  id: string
  sessionId: string
  title?: string
  userId?: string
  messageCount: number
  lastMessageAt?: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
}

export interface ChatSessionListResponse {
  sessions: Omit<ChatSession, 'messages'>[]
  total: number
  hasMore: boolean
}

// Query Keys
export const chatHistoryKeys = {
  all: ['chat-history'] as const,
  sessions: () => [...chatHistoryKeys.all, 'sessions'] as const,
  sessionList: (params?: { userId?: string; limit?: number; offset?: number }) =>
    [...chatHistoryKeys.sessions(), params] as const,
  session: (sessionId: string) => [...chatHistoryKeys.sessions(), sessionId] as const,
}

// Fetch session list
export function useChatSessionList(params: { userId?: string; limit?: number; offset?: number } = {}) {
  const queryParams = new URLSearchParams()
  if (params.userId) queryParams.set('userId', params.userId)
  if (params.limit) queryParams.set('limit', String(params.limit))
  if (params.offset) queryParams.set('offset', String(params.offset))

  const queryString = queryParams.toString()
  const endpoint = `/api/chat-history/sessions${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: chatHistoryKeys.sessionList(params),
    queryFn: () => apiFetch<ChatSessionListResponse>(endpoint),
    staleTime: 1000 * 60, // 1 minute
  })
}

// Fetch a specific session with messages
export function useChatSession(sessionId: string | null, options?: { limit?: number; before?: string }) {
  const queryParams = new URLSearchParams()
  if (options?.limit) queryParams.set('limit', String(options.limit))
  if (options?.before) queryParams.set('before', options.before)

  const queryString = queryParams.toString()

  return useQuery({
    queryKey: chatHistoryKeys.session(sessionId ?? ''),
    queryFn: () =>
      apiFetch<ChatSession & { messages: ChatMessage[] }>(
        `/api/chat-history/sessions/${sessionId}${queryString ? `?${queryString}` : ''}`
      ),
    enabled: !!sessionId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Create or get a session
export function useGetOrCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { sessionId: string; userId?: string }) =>
      apiFetch<ChatSession & { messages: ChatMessage[] }>('/api/chat-history/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(chatHistoryKeys.session(data.sessionId), data)
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.sessions() })
    },
  })
}

// Add a message to a session
export function useAddChatMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      ...messageData
    }: {
      sessionId: string
      role: 'user' | 'assistant' | 'system'
      content: string
      toolsUsed?: string[]
      analysis?: Record<string, unknown>
      actions?: Record<string, unknown>
      tokenCount?: number
      modelId?: string
    }) =>
      apiFetch<ChatMessage>(`/api/chat-history/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData),
      }),
    onSuccess: (_, variables) => {
      // Invalidate session query to refetch messages
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.session(variables.sessionId) })
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.sessions() })
    },
  })
}

// Update session (title, archive status)
export function useUpdateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      ...data
    }: {
      sessionId: string
      title?: string
      isArchived?: boolean
    }) =>
      apiFetch<ChatSession>(`/api/chat-history/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.session(variables.sessionId) })
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.sessions() })
    },
  })
}

// Delete a session
export function useDeleteChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/api/chat-history/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: chatHistoryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.sessions() })
    },
  })
}

// Archive a session
export function useArchiveChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/api/chat-history/sessions/${sessionId}/archive`, {
        method: 'POST',
      }),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: chatHistoryKeys.sessions() })
    },
  })
}

// Generate a new unique session ID
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
