import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'
import type { PaginatedResponse } from './useInventory'

// Types
export interface OrderLine {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  pickedQty: number
  unitPrice: number
  status: 'PENDING' | 'ALLOCATED' | 'PICKING' | 'PICKED' | 'PACKED' | 'SHIPPED'
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  orderDate: string
  requiredDate: string
  shippedDate?: string
  status: 'NEW' | 'ALLOCATED' | 'PICKING' | 'PICKED' | 'PACKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'RUSH'
  orderType: 'STANDARD' | 'RUSH' | 'BACKORDER' | 'DROPSHIP'
  totalLines: number
  totalUnits: number
  totalValue: number
  carrier?: string
  trackingNumber?: string
  waveId?: string
  lines: OrderLine[]
}

export interface CreateOrder {
  customerId: string
  requiredDate: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'RUSH'
  orderType?: 'STANDARD' | 'RUSH' | 'BACKORDER' | 'DROPSHIP'
  lines: {
    productId: string
    quantity: number
  }[]
  notes?: string
}

export interface OrderFilters {
  search?: string
  status?: string
  priority?: string
  customerId?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

// Query Keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  summary: () => [...orderKeys.all, 'summary'] as const,
  waves: () => [...orderKeys.all, 'waves'] as const,
}

// Fetch order list
export function useOrderList(filters: OrderFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.priority) queryParams.set('priority', filters.priority)
  if (filters.customerId) queryParams.set('customerId', filters.customerId)
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate)
  if (filters.toDate) queryParams.set('toDate', filters.toDate)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<Order>>(`/api/orders?${queryParams.toString()}`),
  })
}

// Fetch single order
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiFetch<Order>(`/api/orders/${id}`),
    enabled: !!id,
  })
}

// Fetch order summary/stats
export function useOrderSummary() {
  return useQuery({
    queryKey: orderKeys.summary(),
    queryFn: () =>
      apiFetch<{
        totalOrders: number
        pendingOrders: number
        inProgressOrders: number
        completedToday: number
        lateOrders: number
        rushOrders: number
        avgFulfillmentTime: number
      }>('/api/orders/summary'),
  })
}

// Create order mutation
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: CreateOrder) =>
      apiFetch<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

// Update order status mutation
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      apiFetch<{ success: boolean; message: string }>(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

// Cancel order mutation
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

// Allocate order mutation
export function useAllocateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch<{ success: boolean; message: string; allocated: number }>(
        `/api/orders/${orderId}/allocate`,
        { method: 'POST' }
      ),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}
