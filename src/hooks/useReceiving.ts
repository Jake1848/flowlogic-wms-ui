import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'
import type { PaginatedResponse } from './useInventory'

// Types
export interface Receipt {
  id: string
  receiptNumber: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: 'SCHEDULED' | 'ARRIVED' | 'RECEIVING' | 'COMPLETED' | 'CANCELLED'
  scheduledDate: string
  arrivedDate?: string
  completedDate?: string
  dockId?: string
  dockName?: string
  totalLines: number
  totalExpectedQty: number
  totalReceivedQty: number
  lines: ReceiptLine[]
}

export interface ReceiptLine {
  id: string
  productId: string
  productName: string
  sku: string
  expectedQty: number
  receivedQty: number
  damagedQty: number
  status: 'PENDING' | 'PARTIAL' | 'COMPLETE' | 'OVER_RECEIVED'
  lotNumber?: string
  expirationDate?: string
  putawayLocationId?: string
  putawayLocationCode?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  orderDate: string
  expectedDate: string
  totalLines: number
  totalValue: number
}

export interface ReceivingFilters {
  search?: string
  status?: string
  supplierId?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

// Query Keys
export const receivingKeys = {
  all: ['receiving'] as const,
  receipts: () => [...receivingKeys.all, 'receipts'] as const,
  receiptList: (filters: ReceivingFilters) => [...receivingKeys.receipts(), filters] as const,
  receipt: (id: string) => [...receivingKeys.receipts(), id] as const,
  purchaseOrders: () => [...receivingKeys.all, 'purchaseOrders'] as const,
  purchaseOrder: (id: string) => [...receivingKeys.purchaseOrders(), id] as const,
  summary: () => [...receivingKeys.all, 'summary'] as const,
}

// Fetch receipt list
export function useReceiptList(filters: ReceivingFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.supplierId) queryParams.set('supplierId', filters.supplierId)
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate)
  if (filters.toDate) queryParams.set('toDate', filters.toDate)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: receivingKeys.receiptList(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<Receipt>>(`/api/receiving/receipts?${queryParams.toString()}`),
  })
}

// Fetch single receipt
export function useReceipt(id: string) {
  return useQuery({
    queryKey: receivingKeys.receipt(id),
    queryFn: () => apiFetch<Receipt>(`/api/receiving/receipts/${id}`),
    enabled: !!id,
  })
}

// Fetch purchase orders
export function usePurchaseOrders(status?: string) {
  const queryParams = status ? `?status=${status}` : ''
  return useQuery({
    queryKey: receivingKeys.purchaseOrders(),
    queryFn: () =>
      apiFetch<PurchaseOrder[]>(`/api/receiving/purchase-orders${queryParams}`),
  })
}

// Fetch single purchase order
export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: receivingKeys.purchaseOrder(id),
    queryFn: () => apiFetch<PurchaseOrder>(`/api/receiving/purchase-orders/${id}`),
    enabled: !!id,
  })
}

// Fetch receiving summary
export function useReceivingSummary() {
  return useQuery({
    queryKey: receivingKeys.summary(),
    queryFn: () =>
      apiFetch<{
        scheduledToday: number
        inProgress: number
        completedToday: number
        pendingPutaway: number
        avgReceivingTime: number
        accuracyRate: number
      }>('/api/receiving/summary'),
  })
}

// Create receipt mutation
export function useCreateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      poNumber: string
      supplierId: string
      scheduledDate: string
      dockId?: string
      lines: {
        productId: string
        expectedQty: number
      }[]
    }) =>
      apiFetch<Receipt>('/api/receiving/receipts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receivingKeys.receipts() })
    },
  })
}

// Receive items mutation
export function useReceiveItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      receiptId,
      lineId,
      receivedQty,
      damagedQty,
      lotNumber,
      expirationDate,
      locationId,
    }: {
      receiptId: string
      lineId: string
      receivedQty: number
      damagedQty?: number
      lotNumber?: string
      expirationDate?: string
      locationId?: string
    }) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/receiving/receipts/${receiptId}/lines/${lineId}/receive`,
        {
          method: 'POST',
          body: JSON.stringify({ receivedQty, damagedQty, lotNumber, expirationDate, locationId }),
        }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: receivingKeys.receipt(variables.receiptId) })
      queryClient.invalidateQueries({ queryKey: receivingKeys.receipts() })
    },
  })
}

// Complete receipt mutation
export function useCompleteReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (receiptId: string) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/receiving/receipts/${receiptId}/complete`,
        { method: 'POST' }
      ),
    onSuccess: (_, receiptId) => {
      queryClient.invalidateQueries({ queryKey: receivingKeys.receipt(receiptId) })
      queryClient.invalidateQueries({ queryKey: receivingKeys.receipts() })
    },
  })
}

// Putaway mutation
export function usePutaway() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      receiptId,
      lineId,
      locationId,
      quantity,
    }: {
      receiptId: string
      lineId: string
      locationId: string
      quantity: number
    }) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/receiving/receipts/${receiptId}/lines/${lineId}/putaway`,
        {
          method: 'POST',
          body: JSON.stringify({ locationId, quantity }),
        }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: receivingKeys.receipt(variables.receiptId) })
    },
  })
}
