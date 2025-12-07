import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Carrier {
  id: string
  code: string
  name: string
  type: 'PARCEL' | 'LTL' | 'FTL' | 'AIR' | 'OCEAN' | 'RAIL'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  contactName?: string
  email?: string
  phone?: string
  accountNumber?: string
  apiEnabled: boolean
  trackingUrlTemplate?: string
  defaultService?: string
  createdAt: string
  updatedAt: string
}

export interface CarrierService {
  id: string
  carrierId: string
  code: string
  name: string
  transitDays?: number
  isDefault: boolean
  status: 'ACTIVE' | 'INACTIVE'
}

export interface CarrierFilters {
  search?: string
  status?: string
  type?: string
  page?: number
  limit?: number
}

export const carrierKeys = {
  all: ['carriers'] as const,
  lists: () => [...carrierKeys.all, 'list'] as const,
  list: (filters: CarrierFilters) => [...carrierKeys.lists(), filters] as const,
  details: () => [...carrierKeys.all, 'detail'] as const,
  detail: (id: string) => [...carrierKeys.details(), id] as const,
  services: (id: string) => [...carrierKeys.detail(id), 'services'] as const,
}

export function useCarrierList(filters: CarrierFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.type) queryParams.set('type', filters.type)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: carrierKeys.list(filters),
    queryFn: () => apiFetch<{ data: Carrier[]; total: number }>(`/api/carriers?${queryParams.toString()}`),
  })
}

export function useCarrier(id: string) {
  return useQuery({
    queryKey: carrierKeys.detail(id),
    queryFn: () => apiFetch<Carrier>(`/api/carriers/${id}`),
    enabled: !!id,
  })
}

export function useCarrierServices(carrierId: string) {
  return useQuery({
    queryKey: carrierKeys.services(carrierId),
    queryFn: () => apiFetch<CarrierService[]>(`/api/carriers/${carrierId}/services`),
    enabled: !!carrierId,
  })
}

export function useCreateCarrier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (carrier: Omit<Carrier, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Carrier>('/api/carriers', {
        method: 'POST',
        body: JSON.stringify(carrier),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carrierKeys.all })
    },
  })
}

export function useUpdateCarrier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...carrier }: Partial<Carrier> & { id: string }) =>
      apiFetch<Carrier>(`/api/carriers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(carrier),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: carrierKeys.all })
      queryClient.invalidateQueries({ queryKey: carrierKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCarrier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/carriers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carrierKeys.all })
    },
  })
}
