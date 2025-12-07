import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'VIEWER'
  department?: string
  warehouseId?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface UserFilters {
  search?: string
  role?: string
  status?: string
  warehouseId?: string
  page?: number
  limit?: number
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
}

export function useUserList(filters: UserFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.role) queryParams.set('role', filters.role)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.warehouseId) queryParams.set('warehouseId', filters.warehouseId)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => apiFetch<{ data: User[]; total: number }>(`/api/users?${queryParams.toString()}`),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiFetch<User>(`/api/users/${id}`),
    enabled: !!id,
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => apiFetch<User>('/api/auth/me'),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'> & { password: string }) =>
      apiFetch<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...user }: Partial<User> & { id: string; password?: string }) =>
      apiFetch<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/users/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
