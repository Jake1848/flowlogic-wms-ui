import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Equipment {
  id: string
  assetId: string
  name: string
  type: 'forklift' | 'pallet_jack' | 'reach_truck' | 'scanner' | 'printer' | 'conveyor' | 'other'
  model: string
  serialNumber: string
  location: string
  warehouseId?: string
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'REPAIR' | 'OFFLINE' | 'RETIRED'
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  lastMaintenance?: string
  nextMaintenance?: string
  hoursUsed: number
  assignedTo?: string
  batteryLevel?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  type: 'PREVENTIVE' | 'REPAIR' | 'INSPECTION' | 'CALIBRATION'
  description: string
  date: string
  performedBy: string
  cost: number
  notes?: string
  createdAt: string
}

export interface EquipmentFilters {
  type?: string
  status?: string
  warehouseId?: string
  location?: string
  search?: string
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

// Mock data for when API is not available
const mockEquipmentData: Equipment[] = [
  { id: '1', assetId: 'FLT-001', name: 'Forklift #1', type: 'forklift', model: 'Toyota 8FBE15U', serialNumber: 'TYT12345678', location: 'Zone A', status: 'OPERATIONAL', condition: 'EXCELLENT', lastMaintenance: '2024-01-10', nextMaintenance: '2024-02-10', hoursUsed: 2450, assignedTo: 'John Smith', batteryLevel: 85, createdAt: '2023-01-01', updatedAt: '2024-01-10' },
  { id: '2', assetId: 'FLT-002', name: 'Forklift #2', type: 'forklift', model: 'Toyota 8FBE15U', serialNumber: 'TYT12345679', location: 'Zone B', status: 'OPERATIONAL', condition: 'GOOD', lastMaintenance: '2024-01-05', nextMaintenance: '2024-02-05', hoursUsed: 3120, assignedTo: 'Sarah Johnson', batteryLevel: 62, createdAt: '2023-01-01', updatedAt: '2024-01-05' },
  { id: '3', assetId: 'RCH-001', name: 'Reach Truck #1', type: 'reach_truck', model: 'Crown RR5725', serialNumber: 'CRW98765432', location: 'Zone C', status: 'MAINTENANCE', condition: 'FAIR', lastMaintenance: '2024-01-12', nextMaintenance: '2024-01-15', hoursUsed: 4560, batteryLevel: 30, createdAt: '2023-01-01', updatedAt: '2024-01-12' },
  { id: '4', assetId: 'PJK-001', name: 'Pallet Jack #1', type: 'pallet_jack', model: 'Raymond 8410', serialNumber: 'RAY55667788', location: 'Shipping', status: 'OPERATIONAL', condition: 'GOOD', lastMaintenance: '2024-01-08', nextMaintenance: '2024-02-08', hoursUsed: 1890, createdAt: '2023-01-01', updatedAt: '2024-01-08' },
  { id: '5', assetId: 'SCN-001', name: 'RF Scanner Pool', type: 'scanner', model: 'Zebra MC9300', serialNumber: 'ZBR11223344', location: 'IT Room', status: 'OPERATIONAL', condition: 'EXCELLENT', lastMaintenance: '2024-01-01', nextMaintenance: '2024-04-01', hoursUsed: 0, createdAt: '2023-01-01', updatedAt: '2024-01-01' },
]

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: EquipmentFilters) => [...equipmentKeys.lists(), filters] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
  maintenance: (equipmentId: string) => [...equipmentKeys.all, 'maintenance', equipmentId] as const,
}

export function useEquipmentList(filters: EquipmentFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.type) queryParams.set('type', filters.type)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.warehouseId) queryParams.set('warehouseId', filters.warehouseId)
  if (filters.location) queryParams.set('location', filters.location)
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: equipmentKeys.list(filters),
    queryFn: async () => {
      try {
        return await apiFetch<PaginatedResponse<Equipment>>(`/api/equipment?${queryParams.toString()}`)
      } catch {
        // Return mock data if API is not available
        return {
          success: true,
          data: mockEquipmentData,
          pagination: { page: 1, limit: 50, total: mockEquipmentData.length, pages: 1 }
        }
      }
    },
  })
}

export function useEquipment(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => apiFetch<{ success: boolean; data: Equipment }>(`/api/equipment/${id}`),
    enabled: !!id,
  })
}

export function useEquipmentMaintenance(equipmentId: string) {
  return useQuery({
    queryKey: equipmentKeys.maintenance(equipmentId),
    queryFn: () => apiFetch<{ success: boolean; data: MaintenanceRecord[] }>(`/api/equipment/${equipmentId}/maintenance`),
    enabled: !!equipmentId,
  })
}

export function useCreateEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<{ success: boolean; data: Equipment }>('/api/equipment', {
        method: 'POST',
        body: JSON.stringify(equipment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...equipment }: Partial<Equipment> & { id: string }) =>
      apiFetch<{ success: boolean; data: Equipment }>(`/api/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(equipment),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(variables.id) })
    },
  })
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/equipment/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}

export function useLogMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ equipmentId, ...record }: Omit<MaintenanceRecord, 'id' | 'createdAt'>) =>
      apiFetch<{ success: boolean; data: MaintenanceRecord }>(`/api/equipment/${equipmentId}/maintenance`, {
        method: 'POST',
        body: JSON.stringify(record),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
      queryClient.invalidateQueries({ queryKey: equipmentKeys.maintenance(variables.equipmentId) })
    },
  })
}
