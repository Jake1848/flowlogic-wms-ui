import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Task {
  id: string
  taskNumber: string
  type: 'PICKING' | 'PUTAWAY' | 'REPLENISHMENT' | 'CYCLE_COUNT' | 'MOVE' | 'RECEIVE' | 'SHIP' | 'PACK' | 'TRANSFER' | 'ADJUSTMENT'
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: number
  warehouseId: string
  assignedToId?: string
  assignedToName?: string
  orderId?: string
  orderNumber?: string
  fromLocationId?: string
  fromLocationCode?: string
  toLocationId?: string
  toLocationCode?: string
  productId?: string
  productSku?: string
  productName?: string
  quantity?: number
  quantityCompleted?: number
  startedAt?: string
  completedAt?: string
  dueDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TaskFilters {
  search?: string
  type?: string
  status?: string
  priority?: number
  assignedToId?: string
  warehouseId?: string
  page?: number
  limit?: number
}

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  myTasks: () => [...taskKeys.all, 'my'] as const,
  summary: () => [...taskKeys.all, 'summary'] as const,
}

export function useTaskList(filters: TaskFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.type) queryParams.set('type', filters.type)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.priority) queryParams.set('priority', String(filters.priority))
  if (filters.assignedToId) queryParams.set('assignedToId', filters.assignedToId)
  if (filters.warehouseId) queryParams.set('warehouseId', filters.warehouseId)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => apiFetch<{ data: Task[]; total: number }>(`/api/tasks?${queryParams.toString()}`),
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => apiFetch<Task>(`/api/tasks/${id}`),
    enabled: !!id,
  })
}

export function useMyTasks() {
  return useQuery({
    queryKey: taskKeys.myTasks(),
    queryFn: () => apiFetch<Task[]>('/api/tasks/my'),
  })
}

export function useTaskSummary(warehouseId?: string) {
  const queryParams = warehouseId ? `?warehouseId=${warehouseId}` : ''
  return useQuery({
    queryKey: taskKeys.summary(),
    queryFn: () => apiFetch<{
      pending: number
      inProgress: number
      completed: number
      overdue: number
      byType: Record<string, number>
    }>(`/api/tasks/summary${queryParams}`),
  })
}

export function useAssignTaskToUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      apiFetch<Task>(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useStartTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<Task>(`/api/tasks/${taskId}/start`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, quantityCompleted, notes }: { taskId: string; quantityCompleted?: number; notes?: string }) =>
      apiFetch<Task>(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ quantityCompleted, notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useCancelTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      apiFetch<Task>(`/api/tasks/${taskId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
