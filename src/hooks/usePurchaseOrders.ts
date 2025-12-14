import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface PurchaseOrder {
  id: number
  poNumber: string
  poType: 'STANDARD' | 'BLANKET' | 'CONTRACT' | 'DROP_SHIP' | 'CONSIGNMENT' | 'EMERGENCY'
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUBMITTED' | 'CONFIRMED' | 'OPEN' | 'PARTIAL' | 'RECEIVED' | 'CLOSED' | 'CANCELLED' | 'ON_HOLD'
  warehouseId: number
  warehouseName: string
  vendorId: number
  vendorCode: string
  vendorName: string
  buyerId: string
  buyerName: string
  department: string
  orderDate: string
  expectedDate: string
  receivedDate: string | null
  cancelDate: string | null
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  totalLines: number
  receivedLines: number
  openLines: number
  totalQtyOrdered: number
  totalQtyReceived: number
  totalQtyOpen: number
  totalValue: number
  receivedValue: number
  currency: string
  paymentTerms: string
  freightTerms: string
  fob: string
  shipVia: string
  containerId: string | null
  appointmentId: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface POLineItem {
  lineNumber: number
  itemCode: string
  itemDescription: string
  uom: string
  qtyOrdered: number
  qtyReceived: number
  qtyOpen: number
  qtyCancelled?: number
  qtyDamaged?: number
  unitCost: number
  extendedCost: number
  receivedCost?: number
  status: 'OPEN' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
  lotNumber?: string
  expirationDate?: string
  receivedDate?: string
  location?: string
  qualityStatus?: string
  notes: string
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  vendorAddress?: string
  vendorContact?: string
  vendorPhone?: string
  vendorEmail?: string
  lineItems: POLineItem[]
  history?: Array<{
    action: string
    timestamp: string
    user: string
    details: string
  }>
}

export interface PurchaseOrderFilters {
  warehouseId?: number
  status?: string
  poNumber?: string
  vendorId?: number
  buyerId?: string
  fromDate?: string
  toDate?: string
  expectedFromDate?: string
  expectedToDate?: string
  department?: string
  priority?: string
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const purchaseOrderKeys = {
  all: ['purchaseOrders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (filters: PurchaseOrderFilters) => [...purchaseOrderKeys.lists(), filters] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
  analysis: (id: number) => [...purchaseOrderKeys.all, 'analysis', id] as const,
  messages: (id: number) => [...purchaseOrderKeys.all, 'messages', id] as const,
}

export function usePurchaseOrderList(filters: PurchaseOrderFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.warehouseId) queryParams.set('warehouseId', String(filters.warehouseId))
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.poNumber) queryParams.set('poNumber', filters.poNumber)
  if (filters.vendorId) queryParams.set('vendorId', String(filters.vendorId))
  if (filters.buyerId) queryParams.set('buyerId', filters.buyerId)
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate)
  if (filters.toDate) queryParams.set('toDate', filters.toDate)
  if (filters.expectedFromDate) queryParams.set('expectedFromDate', filters.expectedFromDate)
  if (filters.expectedToDate) queryParams.set('expectedToDate', filters.expectedToDate)
  if (filters.department) queryParams.set('department', filters.department)
  if (filters.priority) queryParams.set('priority', filters.priority)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: purchaseOrderKeys.list(filters),
    queryFn: () => apiFetch<PaginatedResponse<PurchaseOrder>>(`/api/purchase-orders?${queryParams.toString()}`),
  })
}

export function usePurchaseOrder(id: number) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => apiFetch<{ success: boolean; data: PurchaseOrderDetail }>(`/api/purchase-orders/${id}`),
    enabled: id > 0,
  })
}

export function usePurchaseOrderAnalysis(id: number) {
  return useQuery({
    queryKey: purchaseOrderKeys.analysis(id),
    queryFn: () => apiFetch<{ success: boolean; data: unknown }>(`/api/purchase-orders/${id}/analysis`),
    enabled: id > 0,
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (po: Partial<PurchaseOrder> & { lineItems?: Partial<POLineItem>[] }) =>
      apiFetch<{ success: boolean; data: PurchaseOrder }>('/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(po),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
    },
  })
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...po }: Partial<PurchaseOrder> & { id: number }) =>
      apiFetch<{ success: boolean; data: PurchaseOrder }>(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(po),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
    },
  })
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, cancelReason }: { id: number; cancelReason?: string }) =>
      apiFetch<{ success: boolean }>(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ cancelReason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
    },
  })
}

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, sendMethod, emailTo }: { id: number; sendMethod?: string; emailTo?: string }) =>
      apiFetch<{ success: boolean }>(`/api/purchase-orders/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ sendMethod, emailTo }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
    },
  })
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      apiFetch<{ success: boolean }>(`/api/purchase-orders/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
    },
  })
}

export function useClosePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, closeReason, forceClose }: { id: number; closeReason?: string; forceClose?: boolean }) =>
      apiFetch<{ success: boolean }>(`/api/purchase-orders/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ closeReason, forceClose }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
    },
  })
}
