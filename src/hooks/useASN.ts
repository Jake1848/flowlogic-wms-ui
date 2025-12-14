import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface ASNLine {
  id: string
  lineNumber: number
  productId: string
  product?: {
    id: string
    sku: string
    name: string
  }
  quantityExpected: number
  quantityReceived: number
  uom: string
  lotNumber?: string
  expirationDate?: string
  receivedAt?: string
  poLineNumber?: number
}

export interface ASN {
  id: string
  asnNumber: string
  vendorId: string
  vendor?: {
    id: string
    code: string
    name: string
  }
  warehouseId: string
  warehouse?: {
    id: string
    code: string
    name: string
  }
  carrierId?: string
  carrier?: {
    id: string
    code: string
    name: string
  }
  purchaseOrderId?: string
  purchaseOrder?: {
    id: string
    poNumber: string
  }
  status: 'PENDING' | 'VALIDATED' | 'SCHEDULED' | 'IN_TRANSIT' | 'ARRIVED' | 'RECEIVING' | 'RECEIVED' | 'CLOSED' | 'CANCELLED'
  expectedArrival: string
  arrivalTime?: string
  bolNumber?: string
  proNumber?: string
  sealNumber?: string
  trailerNumber?: string
  trackingNumber?: string
  totalPallets?: number
  totalCases?: number
  totalWeight?: number
  lines: ASNLine[]
  _count?: {
    lines: number
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ASNFilters {
  status?: string
  vendorId?: string
  warehouseId?: string
  carrierId?: string
  dateFrom?: string
  dateTo?: string
  expectedDateFrom?: string
  expectedDateTo?: string
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const asnKeys = {
  all: ['asns'] as const,
  lists: () => [...asnKeys.all, 'list'] as const,
  list: (filters: ASNFilters) => [...asnKeys.lists(), filters] as const,
  details: () => [...asnKeys.all, 'detail'] as const,
  detail: (id: string) => [...asnKeys.details(), id] as const,
  stats: () => [...asnKeys.all, 'stats'] as const,
  calendar: (start: string, end: string) => [...asnKeys.all, 'calendar', start, end] as const,
}

export function useASNList(filters: ASNFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.vendorId) queryParams.set('vendorId', filters.vendorId)
  if (filters.warehouseId) queryParams.set('warehouseId', filters.warehouseId)
  if (filters.carrierId) queryParams.set('carrierId', filters.carrierId)
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo)
  if (filters.expectedDateFrom) queryParams.set('expectedDateFrom', filters.expectedDateFrom)
  if (filters.expectedDateTo) queryParams.set('expectedDateTo', filters.expectedDateTo)
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: asnKeys.list(filters),
    queryFn: () => apiFetch<PaginatedResponse<ASN>>(`/api/asn?${queryParams.toString()}`),
  })
}

export function useASN(id: string) {
  return useQuery({
    queryKey: asnKeys.detail(id),
    queryFn: () => apiFetch<ASN & { progress: { totalExpected: number; totalReceived: number; percentComplete: number } }>(`/api/asn/${id}`),
    enabled: !!id,
  })
}

export function useASNStats(warehouseId?: string) {
  const queryParams = new URLSearchParams()
  if (warehouseId) queryParams.set('warehouseId', warehouseId)

  return useQuery({
    queryKey: asnKeys.stats(),
    queryFn: () => apiFetch<{
      byStatus: Record<string, number>
      todayExpected: number
      overdueASNs: number
      avgReceivingTimeMinutes: number
    }>(`/api/asn/stats/summary?${queryParams.toString()}`),
  })
}

export function useCreateASN() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asn: Partial<ASN> & { lines?: Array<{ productId: string; quantity: number; uom?: string; lotNumber?: string; expirationDate?: string }> }) =>
      apiFetch<ASN>('/api/asn', {
        method: 'POST',
        body: JSON.stringify(asn),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
    },
  })
}

export function useUpdateASN() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...asn }: Partial<ASN> & { id: string }) =>
      apiFetch<ASN>(`/api/asn/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(asn),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(variables.id) })
    },
  })
}

export function useDeleteASN() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/api/asn/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
    },
  })
}

export function useValidateASN() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ valid: boolean; warnings: Array<{ lineNumber: number; message: string }>; errors: Array<{ lineNumber: number; message: string }> }>(`/api/asn/${id}/validate`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(id) })
    },
  })
}

export function useStartReceiving() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ASN>(`/api/asn/${id}/start-receiving`, {
        method: 'PATCH',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(id) })
    },
  })
}

export function useReceiveASNLines() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, lines, receivingLocationId }: { id: string; lines: Array<{ lineId: string; quantityReceived: number; lotNumber?: string; expirationDate?: string }>; receivingLocationId: string }) =>
      apiFetch<{ message: string; results: Array<{ lineId: string; quantityReceived: number; inventoryId: string }> }>(`/api/asn/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ lines, receivingLocationId }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(variables.id) })
    },
  })
}

export function useCloseASN() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, closeNotes, acceptVariance }: { id: string; closeNotes?: string; acceptVariance?: boolean }) =>
      apiFetch<ASN>(`/api/asn/${id}/close`, {
        method: 'PATCH',
        body: JSON.stringify({ closeNotes, acceptVariance }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: asnKeys.all })
      queryClient.invalidateQueries({ queryKey: asnKeys.detail(variables.id) })
    },
  })
}
