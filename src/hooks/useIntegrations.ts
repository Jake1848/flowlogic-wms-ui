import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Integration, SyncLog, DataMapping } from '../types/integrations'

// Mock data for fallback
const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Manhattan WMS - Primary',
    type: 'WMS',
    provider: 'manhattan',
    method: 'REST API',
    status: 'connected',
    lastSync: '2024-12-28T15:30:00Z',
    endpoint: 'https://manhattan.company.com/api/v2',
    dataFlow: 'bidirectional',
    syncFrequency: 'Real-time',
    recordsToday: 2847,
  },
  {
    id: '2',
    name: 'SAP EWM - Distribution Center',
    type: 'WMS',
    provider: 'sap-ewm',
    method: 'REST API',
    status: 'connected',
    lastSync: '2024-12-28T15:28:45Z',
    endpoint: 'https://sap.company.com/sap/opu/odata',
    dataFlow: 'bidirectional',
    syncFrequency: 'Every 5 minutes',
    recordsToday: 1456,
  },
  {
    id: '3',
    name: 'Blue Yonder - Forecasting',
    type: 'WMS',
    provider: 'blue-yonder',
    method: 'File Upload',
    status: 'syncing',
    lastSync: '2024-12-28T15:15:00Z',
    dataFlow: 'inbound',
    syncFrequency: 'Daily',
    recordsToday: 892,
  },
  {
    id: '4',
    name: 'JD Edwards ERP',
    type: 'ERP',
    provider: 'jde',
    method: 'REST API',
    status: 'connected',
    lastSync: '2024-12-28T15:30:00Z',
    endpoint: 'https://erp.company.com/api/v1',
    dataFlow: 'bidirectional',
    syncFrequency: 'Real-time',
    recordsToday: 1247,
  },
  {
    id: '5',
    name: 'Legacy WMS - SFTP',
    type: 'WMS',
    provider: 'custom',
    method: 'SFTP',
    status: 'error',
    lastSync: '2024-12-28T12:15:00Z',
    endpoint: 'sftp://legacy.company.com/wms',
    dataFlow: 'inbound',
    syncFrequency: 'Hourly',
    recordsToday: 0,
  },
]

const mockLogs: SyncLog[] = [
  {
    id: '1',
    integrationId: '1',
    integrationName: 'Manhattan WMS',
    status: 'success',
    message: 'Synced inventory snapshots successfully',
    recordCount: 1250,
    timestamp: '2024-12-28T15:30:00Z'
  },
  {
    id: '2',
    integrationId: '2',
    integrationName: 'SAP EWM',
    status: 'success',
    message: 'Imported cycle count variances',
    recordCount: 45,
    timestamp: '2024-12-28T15:28:45Z'
  },
  {
    id: '3',
    integrationId: '5',
    integrationName: 'Legacy WMS',
    status: 'error',
    message: 'SFTP connection timeout - retrying',
    recordCount: 0,
    timestamp: '2024-12-28T12:15:00Z'
  },
]

const mockMappings: DataMapping[] = [
  {
    id: '1',
    sourceSystem: 'Manhattan WMS',
    sourceField: 'INV_SNAPSHOT.SKU',
    targetField: 'inventorySnapshot.sku',
    transformation: 'Uppercase',
    active: true,
  },
  {
    id: '2',
    sourceSystem: 'Manhattan WMS',
    sourceField: 'INV_SNAPSHOT.QTY_OH',
    targetField: 'inventorySnapshot.quantityOnHand',
    active: true,
  },
  {
    id: '3',
    sourceSystem: 'SAP EWM',
    sourceField: 'CC_VARIANCE.DIFF_QTY',
    targetField: 'cycleCountSnapshot.variance',
    active: true,
  },
  {
    id: '4',
    sourceSystem: 'SAP EWM',
    sourceField: 'ADJ_RECORD.ADJ_QTY',
    targetField: 'adjustmentSnapshot.adjustmentQty',
    active: true,
  },
]

export function useIntegrations() {
  const queryClient = useQueryClient()

  const { data: integrationsData, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      try {
        const response = await api.get('/integrations')
        return response.data
      } catch {
        return { integrations: mockIntegrations }
      }
    }
  })

  const integrations: Integration[] = (integrationsData as { integrations?: Integration[] })?.integrations || mockIntegrations

  const testConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await api.post(`/integrations/${integrationId}/test`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
  })

  const syncNow = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await api.post(`/integrations/${integrationId}/sync`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integration-logs'] })
    }
  })

  const toggleIntegration = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await api.put(`/integrations/${id}`, { enabled })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
  })

  // Summary stats
  const connectedSystems = integrations.filter(i => i.status === 'connected').length
  const totalRecordsToday = integrations.reduce((sum, i) => sum + i.recordsToday, 0)
  const wmsConnections = integrations.filter(i => i.type === 'WMS').length
  const errorCount = integrations.filter(i => i.status === 'error').length

  return {
    integrations,
    integrationsLoading,
    testConnection,
    syncNow,
    toggleIntegration,
    stats: {
      connectedSystems,
      totalRecordsToday,
      wmsConnections,
      errorCount
    }
  }
}

export function useSyncLogs(enabled: boolean) {
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['integration-logs'],
    queryFn: async () => {
      try {
        const response = await api.get('/integrations/logs')
        return response.data
      } catch {
        return { logs: mockLogs }
      }
    },
    enabled
  })

  const logs: SyncLog[] = (logsData as { logs?: SyncLog[] })?.logs || mockLogs

  return { logs, logsLoading }
}

export function useDataMappings() {
  // For now, return mock data - can be enhanced with API call later
  return { mappings: mockMappings }
}
