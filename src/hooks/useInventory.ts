import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

// Types
export interface InventoryItem {
  id: string
  productId: string
  productName: string
  sku: string
  locationId: string
  locationCode: string
  quantity: number
  availableQty: number
  reservedQty: number
  lotNumber?: string
  expirationDate?: string
  status: 'AVAILABLE' | 'RESERVED' | 'DAMAGED' | 'QUARANTINE' | 'EXPIRED'
  lastCountDate?: string
  lastMovementDate?: string
}

export interface InventoryLocation {
  id: string
  code: string
  zone: string
  aisle: string
  bay: string
  level: string
  type: 'BULK' | 'PICK' | 'RESERVE' | 'STAGING' | 'RECEIVING' | 'SHIPPING'
  status: 'ACTIVE' | 'INACTIVE' | 'FULL' | 'BLOCKED'
  capacity: number
  currentQty: number
  utilizationPct: number
}

export interface InventoryAdjustment {
  locationId: string
  productId: string
  quantity: number
  reason: 'CYCLE_COUNT' | 'DAMAGE' | 'RECEIVING_ERROR' | 'SHIPPING_ERROR' | 'EXPIRED' | 'OTHER'
  notes?: string
}

export interface InventoryTransfer {
  productId: string
  fromLocationId: string
  toLocationId: string
  quantity: number
  notes?: string
}

export interface InventoryFilters {
  search?: string
  locationId?: string
  zone?: string
  status?: string
  lowStock?: boolean
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Query Keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: InventoryFilters) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  locations: () => [...inventoryKeys.all, 'locations'] as const,
  location: (id: string) => [...inventoryKeys.locations(), id] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
}

// Fetch inventory list
export function useInventoryList(filters: InventoryFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.locationId) queryParams.set('locationId', filters.locationId)
  if (filters.zone) queryParams.set('zone', filters.zone)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.lowStock) queryParams.set('lowStock', 'true')
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<InventoryItem>>(
        `/api/inventory?${queryParams.toString()}`
      ),
  })
}

// Fetch single inventory item
export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => apiFetch<InventoryItem>(`/api/inventory/${id}`),
    enabled: !!id,
  })
}

// Fetch inventory locations
export function useInventoryLocations(zone?: string) {
  const queryParams = zone ? `?zone=${zone}` : ''
  return useQuery({
    queryKey: inventoryKeys.locations(),
    queryFn: () => apiFetch<InventoryLocation[]>(`/api/inventory/locations${queryParams}`),
  })
}

// Fetch inventory summary/stats
export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn: () =>
      apiFetch<{
        totalItems: number
        totalValue: number
        totalLocations: number
        utilizationRate: number
        lowStockItems: number
        expiringSoon: number
      }>('/api/inventory/summary'),
  })
}

// Adjust inventory mutation
export function useInventoryAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adjustment: InventoryAdjustment) =>
      apiFetch<{ success: boolean; message: string }>('/api/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(adjustment),
      }),
    onSuccess: () => {
      // Invalidate and refetch inventory queries
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

// Transfer inventory mutation
export function useInventoryTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transfer: InventoryTransfer) =>
      apiFetch<{ success: boolean; message: string }>('/api/inventory/transfer', {
        method: 'POST',
        body: JSON.stringify(transfer),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}
