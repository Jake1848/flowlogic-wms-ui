import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Customer {
  id: string
  code: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  billingAddress?: string
  shippingAddress?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  creditLimit?: number
  paymentTerms?: string
  preferredCarrier?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
}

export function useCustomerList(filters: CustomerFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => apiFetch<{ data: Customer[]; total: number }>(`/api/customers?${queryParams.toString()}`),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => apiFetch<Customer>(`/api/customers/${id}`),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...customer }: Partial<Customer> & { id: string }) =>
      apiFetch<Customer>(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customer),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/customers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
