import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/queryClient'

export interface Document {
  id: string
  documentNumber: string
  type: 'BOL' | 'PACKING_SLIP' | 'SHIPPING_LABEL' | 'INVOICE' | 'POD' | 'CUSTOMS' | 'MSDS' | 'CERTIFICATE'
  name: string
  relatedTo: string
  relatedType: 'ORDER' | 'SHIPMENT' | 'RECEIPT' | 'ITEM' | 'VENDOR'
  createdDate: string
  createdBy: string
  fileSize: string
  filePath?: string
  mimeType?: string
  status: 'DRAFT' | 'FINAL' | 'VOIDED' | 'ARCHIVED'
  printCount: number
  warehouseId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentTemplate {
  id: string
  name: string
  type: string
  description?: string
  lastModified: string
  usageCount: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface DocumentFilters {
  type?: string
  status?: string
  relatedType?: string
  relatedTo?: string
  search?: string
  dateFrom?: string
  dateTo?: string
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
const mockDocumentData: Document[] = [
  { id: '1', documentNumber: 'BOL-2024-0145', type: 'BOL', name: 'Bill of Lading - SO-112233', relatedTo: 'SO-112233', relatedType: 'SHIPMENT', createdDate: '2024-01-15 10:30', createdBy: 'John Smith', fileSize: '125 KB', status: 'FINAL', printCount: 3, createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', documentNumber: 'PKS-2024-0890', type: 'PACKING_SLIP', name: 'Packing Slip - ORD-5001', relatedTo: 'ORD-5001', relatedType: 'ORDER', createdDate: '2024-01-15 09:15', createdBy: 'Sarah Johnson', fileSize: '85 KB', status: 'FINAL', printCount: 2, createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '3', documentNumber: 'LBL-2024-1234', type: 'SHIPPING_LABEL', name: 'Shipping Label - 1Z999AA1', relatedTo: 'TRK-1Z999AA1', relatedType: 'SHIPMENT', createdDate: '2024-01-15 11:00', createdBy: 'Mike Williams', fileSize: '45 KB', status: 'FINAL', printCount: 1, createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '4', documentNumber: 'INV-2024-0567', type: 'INVOICE', name: 'Commercial Invoice - EXP-445', relatedTo: 'EXP-445', relatedType: 'SHIPMENT', createdDate: '2024-01-14 16:30', createdBy: 'Emily Davis', fileSize: '156 KB', status: 'FINAL', printCount: 2, createdAt: '2024-01-14', updatedAt: '2024-01-14' },
  { id: '5', documentNumber: 'POD-2024-0089', type: 'POD', name: 'Proof of Delivery - SO-112200', relatedTo: 'SO-112200', relatedType: 'SHIPMENT', createdDate: '2024-01-14 14:20', createdBy: 'System', fileSize: '890 KB', status: 'FINAL', printCount: 0, createdAt: '2024-01-14', updatedAt: '2024-01-14' },
]

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  templates: () => [...documentKeys.all, 'templates'] as const,
}

export function useDocumentList(filters: DocumentFilters = {}) {
  const queryParams = new URLSearchParams()
  if (filters.type) queryParams.set('type', filters.type)
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.relatedType) queryParams.set('relatedType', filters.relatedType)
  if (filters.relatedTo) queryParams.set('relatedTo', filters.relatedTo)
  if (filters.search) queryParams.set('search', filters.search)
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo)
  if (filters.page) queryParams.set('page', String(filters.page))
  if (filters.limit) queryParams.set('limit', String(filters.limit))

  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async () => {
      try {
        return await apiFetch<PaginatedResponse<Document>>(`/api/documents?${queryParams.toString()}`)
      } catch {
        // Return mock data if API is not available
        return {
          success: true,
          data: mockDocumentData,
          pagination: { page: 1, limit: 50, total: mockDocumentData.length, pages: 1 }
        }
      }
    },
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => apiFetch<{ success: boolean; data: Document }>(`/api/documents/${id}`),
    enabled: !!id,
  })
}

export function useDocumentTemplates() {
  return useQuery({
    queryKey: documentKeys.templates(),
    queryFn: () => apiFetch<{ success: boolean; data: DocumentTemplate[] }>('/api/documents/templates'),
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<{ success: boolean; data: Document }>('/api/documents', {
        method: 'POST',
        body: JSON.stringify(document),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...document }: Partial<Document> & { id: string }) =>
      apiFetch<{ success: boolean; data: Document }>(`/api/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(document),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.id) })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/documents/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}

export function usePrintDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, printerId }: { id: string; printerId?: string }) =>
      apiFetch<{ success: boolean; printJobId: string }>(`/api/documents/${id}/print`, {
        method: 'POST',
        body: JSON.stringify({ printerId }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.id) })
    },
  })
}
