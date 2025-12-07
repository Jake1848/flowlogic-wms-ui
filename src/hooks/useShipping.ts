import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'
import type { PaginatedResponse } from './useInventory'

// Types
export interface Shipment {
  id: string
  shipmentNumber: string
  orderId: string
  orderNumber: string
  customerId: string
  customerName: string
  status: 'PENDING' | 'PICKING' | 'PACKING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  carrier: string
  serviceType: string
  trackingNumber?: string
  shipDate?: string
  deliveryDate?: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  shippingCost?: number
  labelUrl?: string
  packages: ShipmentPackage[]
}

export interface ShipmentPackage {
  id: string
  packageNumber: string
  trackingNumber?: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  contents: {
    productId: string
    productName: string
    quantity: number
  }[]
}

export interface ShippingCarrier {
  id: string
  name: string
  code: string
  services: ShippingCarrierService[]
  isActive: boolean
}

export interface ShippingCarrierService {
  id: string
  name: string
  code: string
  transitDays: number
  isActive: boolean
}

export interface DockAppointment {
  id: string
  dockId: string
  dockName: string
  type: 'INBOUND' | 'OUTBOUND'
  carrier: string
  scheduledTime: string
  arrivalTime?: string
  departureTime?: string
  status: 'SCHEDULED' | 'CHECKED_IN' | 'LOADING' | 'UNLOADING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  trailerNumber?: string
  driverName?: string
  notes?: string
}

export interface ShippingFilters {
  search?: string
  status?: string
  carrier?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

// Query Keys
export const shippingKeys = {
  all: ['shipping'] as const,
  shipments: () => [...shippingKeys.all, 'shipments'] as const,
  shipmentList: (filters: ShippingFilters) => [...shippingKeys.shipments(), filters] as const,
  shipment: (id: string) => [...shippingKeys.shipments(), id] as const,
  carriers: () => [...shippingKeys.all, 'carriers'] as const,
  docks: () => [...shippingKeys.all, 'docks'] as const,
  appointments: () => [...shippingKeys.all, 'appointments'] as const,
  appointmentList: (date?: string) => [...shippingKeys.appointments(), date] as const,
  summary: () => [...shippingKeys.all, 'summary'] as const,
}

// Fetch shipment list
export function useShipmentList(filters: ShippingFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.carrier) queryParams.set('carrier', filters.carrier)
  if (filters.fromDate) queryParams.set('fromDate', filters.fromDate)
  if (filters.toDate) queryParams.set('toDate', filters.toDate)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: shippingKeys.shipmentList(filters),
    queryFn: () =>
      apiFetch<PaginatedResponse<Shipment>>(`/api/shipping/shipments?${queryParams.toString()}`),
  })
}

// Fetch single shipment
export function useShipment(id: string) {
  return useQuery({
    queryKey: shippingKeys.shipment(id),
    queryFn: () => apiFetch<Shipment>(`/api/shipping/shipments/${id}`),
    enabled: !!id,
  })
}

// Fetch carriers for shipping
export function useShippingCarriers() {
  return useQuery({
    queryKey: shippingKeys.carriers(),
    queryFn: () => apiFetch<ShippingCarrier[]>('/api/shipping/carriers'),
    staleTime: 1000 * 60 * 60, // 1 hour - carriers don't change often
  })
}

// Fetch dock appointments
export function useDockAppointments(date?: string) {
  const queryParams = date ? `?date=${date}` : ''
  return useQuery({
    queryKey: shippingKeys.appointmentList(date),
    queryFn: () =>
      apiFetch<DockAppointment[]>(`/api/shipping/appointments${queryParams}`),
  })
}

// Fetch shipping summary
export function useShippingSummary() {
  return useQuery({
    queryKey: shippingKeys.summary(),
    queryFn: () =>
      apiFetch<{
        todayShipments: number
        pendingShipments: number
        inTransit: number
        delivered: number
        avgShipTime: number
        onTimeRate: number
        carrierBreakdown: { carrier: string; count: number }[]
      }>('/api/shipping/summary'),
  })
}

// Create shipment mutation
export function useCreateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      orderId: string
      carrier: string
      serviceType: string
      packages: { weight: number; dimensions: { length: number; width: number; height: number } }[]
    }) =>
      apiFetch<Shipment>('/api/shipping/shipments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.shipments() })
    },
  })
}

// Ship shipment mutation (mark as shipped)
export function useShipShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipmentId, trackingNumber }: { shipmentId: string; trackingNumber?: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/api/shipping/shipments/${shipmentId}/ship`, {
        method: 'POST',
        body: JSON.stringify({ trackingNumber }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.shipment(variables.shipmentId) })
      queryClient.invalidateQueries({ queryKey: shippingKeys.shipments() })
    },
  })
}

// Create dock appointment mutation
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      dockId: string
      type: 'INBOUND' | 'OUTBOUND'
      carrier: string
      scheduledTime: string
      trailerNumber?: string
      driverName?: string
      notes?: string
    }) =>
      apiFetch<DockAppointment>('/api/shipping/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.appointments() })
    },
  })
}

// Check in appointment mutation
export function useCheckInAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ appointmentId, trailerNumber }: { appointmentId: string; trailerNumber?: string }) =>
      apiFetch<{ success: boolean; message: string }>(`/api/shipping/appointments/${appointmentId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ trailerNumber }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.appointments() })
    },
  })
}
