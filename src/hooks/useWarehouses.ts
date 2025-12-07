import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Warehouse {
  id: string
  code: string
  name: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  type: 'DISTRIBUTION' | 'FULFILLMENT' | 'CROSS_DOCK' | 'COLD_STORAGE' | 'BONDED'
  totalSquareFeet?: number
  totalLocations?: number
  usedLocations?: number
  utilizationRate?: number
  timezone?: string
  operatingHours?: string
  createdAt: string
  updatedAt: string
}

export interface WarehouseZone {
  id: string
  warehouseId: string
  code: string
  name: string
  type: 'RECEIVING' | 'SHIPPING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'STAGING' | 'RETURNS'
  status: 'ACTIVE' | 'INACTIVE'
  temperature?: string
  locationCount?: number
}

export interface WarehouseFilters {
  search?: string
  status?: string
  type?: string
  page?: number
  limit?: number
}

export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: (filters: WarehouseFilters) => [...warehouseKeys.lists(), filters] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
  zones: (id: string) => [...warehouseKeys.detail(id), 'zones'] as const,
  stats: (id: string) => [...warehouseKeys.detail(id), 'stats'] as const,
}

export function useWarehouseList(filters: WarehouseFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.type) queryParams.set('type', filters.type)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: warehouseKeys.list(filters),
    queryFn: () => apiFetch<{ data: Warehouse[]; total: number }>(`/api/warehouses?${queryParams.toString()}`),
  })
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => apiFetch<Warehouse>(`/api/warehouses/${id}`),
    enabled: !!id,
  })
}

export function useWarehouseZones(warehouseId: string) {
  return useQuery({
    queryKey: warehouseKeys.zones(warehouseId),
    queryFn: () => apiFetch<WarehouseZone[]>(`/api/warehouses/${warehouseId}/zones`),
    enabled: !!warehouseId,
  })
}

export function useWarehouseStats(warehouseId: string) {
  return useQuery({
    queryKey: warehouseKeys.stats(warehouseId),
    queryFn: () => apiFetch<{
      totalInventory: number
      totalOrders: number
      utilizationRate: number
      ordersToday: number
      shipmentsToday: number
      activeWorkers: number
    }>(`/api/warehouses/${warehouseId}/stats`),
    enabled: !!warehouseId,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Warehouse>('/api/warehouses', {
        method: 'POST',
        body: JSON.stringify(warehouse),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...warehouse }: Partial<Warehouse> & { id: string }) =>
      apiFetch<Warehouse>(`/api/warehouses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(warehouse),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(variables.id) })
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/warehouses/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}
