import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Vendor {
  id: string
  code: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  rating?: number
  paymentTerms?: string
  leadTimeDays?: number
  createdAt: string
  updatedAt: string
}

export interface VendorFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: VendorFilters) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
}

export function useVendorList(filters: VendorFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: vendorKeys.list(filters),
    queryFn: () => apiFetch<{ data: Vendor[]; total: number }>(`/api/vendors?${queryParams.toString()}`),
  })
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => apiFetch<Vendor>(`/api/vendors/${id}`),
    enabled: !!id,
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Vendor>('/api/vendors', {
        method: 'POST',
        body: JSON.stringify(vendor),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...vendor }: Partial<Vendor> & { id: string }) =>
      apiFetch<Vendor>(`/api/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vendor),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) })
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/vendors/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all })
    },
  })
}
