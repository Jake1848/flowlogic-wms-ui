import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Alert {
  id: string
  type: 'INVENTORY' | 'ORDER' | 'RECEIVING' | 'SHIPPING' | 'LABOR' | 'SYSTEM' | 'QUALITY' | 'SAFETY'
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  title: string
  message: string
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  warehouseId?: string
  referenceType?: string
  referenceId?: string
  referenceNumber?: string
  assignedToId?: string
  assignedToName?: string
  acknowledgedAt?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AlertFilters {
  type?: string
  severity?: string
  status?: string
  warehouseId?: string
  page?: number
  limit?: number
}

export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (filters: AlertFilters) => [...alertKeys.lists(), filters] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
  active: () => [...alertKeys.all, 'active'] as const,
  counts: () => [...alertKeys.all, 'counts'] as const,
}

export function useAlertList(filters: AlertFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.type) queryParams.set('type', filters.type)
  if (filters.severity) queryParams.set('severity', filters.severity)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.warehouseId) queryParams.set('warehouseId', filters.warehouseId)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: () => apiFetch<{ data: Alert[]; total: number }>(`/api/alerts?${queryParams.toString()}`),
  })
}

export function useActiveAlerts(warehouseId?: string) {
  const queryParams = warehouseId ? `?warehouseId=${warehouseId}` : ''
  return useQuery({
    queryKey: alertKeys.active(),
    queryFn: () => apiFetch<Alert[]>(`/api/alerts/active${queryParams}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useAlertCounts(warehouseId?: string) {
  const queryParams = warehouseId ? `?warehouseId=${warehouseId}` : ''
  return useQuery({
    queryKey: alertKeys.counts(),
    queryFn: () => apiFetch<{
      total: number
      bySeverity: Record<string, number>
      byType: Record<string, number>
      critical: number
      unacknowledged: number
    }>(`/api/alerts/counts${queryParams}`),
    refetchInterval: 30000,
  })
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: alertKeys.detail(id),
    queryFn: () => apiFetch<Alert>(`/api/alerts/${id}`),
    enabled: !!id,
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<Alert>(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, resolution }: { alertId: string; resolution?: string }) =>
      apiFetch<Alert>(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}

export function useDismissAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<Alert>(`/api/alerts/${alertId}/dismiss`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alert: Omit<Alert, 'id' | 'status' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Alert>('/api/alerts', {
        method: 'POST',
        body: JSON.stringify(alert),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all })
    },
  })
}
