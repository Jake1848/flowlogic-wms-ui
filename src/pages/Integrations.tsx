import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Settings,
  Trash2,
  Pause,
  Upload,
  Download,
  Loader2,
  Link,
  Unlink,
  Server,
  Warehouse,
  FileJson,
  Eye,
  EyeOff
} from 'lucide-react'
import api from '../lib/api'

interface Integration {
  id: string
  name: string
  type: 'ERP' | 'TMS' | 'WMS' | 'E-Commerce' | 'Other'
  provider: string
  method: 'REST API' | 'EDI' | 'SFTP' | 'Database' | 'Webhook' | 'File Upload'
  status: 'connected' | 'error' | 'syncing' | 'disabled' | 'pending'
  lastSync: string | null
  endpoint?: string
  dataFlow: 'inbound' | 'outbound' | 'bidirectional'
  syncFrequency: string
  recordsToday: number
  config?: Record<string, string>
}

interface WMSConnector {
  id: string
  name: string
  logo: string
  description: string
  features: string[]
  methods: string[]
  popular: boolean
}

interface DataMapping {
  id: string
  sourceSystem: string
  sourceField: string
  targetField: string
  transformation?: string
  active: boolean
}

interface SyncLog {
  id: string
  integrationId: string
  integrationName: string
  status: 'success' | 'error' | 'warning'
  message: string
  recordCount: number
  timestamp: string
}

// Available WMS connectors
const WMS_CONNECTORS: WMSConnector[] = [
  {
    id: 'manhattan',
    name: 'Manhattan Associates',
    logo: 'M',
    description: 'Enterprise WMS for complex supply chain operations',
    features: ['Inventory Sync', 'Order Management', 'Labor Tracking', 'Receiving', 'Shipping'],
    methods: ['REST API', 'EDI', 'Database'],
    popular: true
  },
  {
    id: 'sap-ewm',
    name: 'SAP Extended Warehouse Management',
    logo: 'SAP',
    description: 'Integrated WMS for SAP ecosystem',
    features: ['Inventory Sync', 'Task Management', 'RF Operations', 'Slotting'],
    methods: ['REST API', 'BAPI', 'IDoc'],
    popular: true
  },
  {
    id: 'blue-yonder',
    name: 'Blue Yonder WMS',
    logo: 'BY',
    description: 'AI-powered warehouse management system',
    features: ['Demand Forecasting', 'Labor Optimization', 'Inventory Control'],
    methods: ['REST API', 'File Upload'],
    popular: true
  },
  {
    id: 'oracle-wms',
    name: 'Oracle WMS Cloud',
    logo: 'O',
    description: 'Cloud-native warehouse management',
    features: ['Inventory Visibility', 'Wave Planning', 'Shipping'],
    methods: ['REST API', 'Oracle Integration Cloud'],
    popular: true
  },
  {
    id: 'infor-wms',
    name: 'Infor WMS',
    logo: 'I',
    description: 'Industry-specific warehouse solutions',
    features: ['3PL Support', 'Multi-client', 'Billing'],
    methods: ['REST API', 'ION', 'File Upload'],
    popular: false
  },
  {
    id: 'korber',
    name: 'Korber WMS',
    logo: 'K',
    description: 'Flexible warehouse management platform',
    features: ['Inventory Control', 'Pick Optimization', 'Returns'],
    methods: ['REST API', 'File Upload'],
    popular: false
  },
  {
    id: 'highjump',
    name: 'HighJump (Korber)',
    logo: 'HJ',
    description: 'Adaptable WMS for diverse industries',
    features: ['RF Operations', 'Directed Work', 'Cycle Counting'],
    methods: ['REST API', 'Database', 'File Upload'],
    popular: false
  },
  {
    id: 'custom',
    name: 'Custom WMS',
    logo: '?',
    description: 'Connect to any WMS via flexible configuration',
    features: ['Custom Fields', 'Flexible Mapping', 'Any Protocol'],
    methods: ['REST API', 'SFTP', 'Database', 'File Upload'],
    popular: false
  }
]

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'systems' | 'connectors' | 'mappings' | 'logs'>('systems')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<WMSConnector | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const queryClient = useQueryClient()

  // Fetch integrations
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

  // Fetch sync logs
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
    enabled: activeTab === 'logs'
  })

  // Test connection mutation
  const testConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await api.post(`/integrations/${integrationId}/test`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
  })

  // Sync now mutation
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

  // Toggle integration status
  const toggleIntegration = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await api.put(`/integrations/${id}`, { enabled })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
  })

  // Mock data
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

  const integrations: Integration[] = (integrationsData as { integrations?: Integration[] })?.integrations || mockIntegrations
  const logs: SyncLog[] = (logsData as { logs?: SyncLog[] })?.logs || mockLogs
  const dataMappings = mockMappings

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'syncing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return <Pause className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: Integration['type']) => {
    switch (type) {
      case 'ERP':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'TMS':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'WMS':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'E-Commerce':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const connectedSystems = integrations.filter(i => i.status === 'connected').length
  const totalRecordsToday = integrations.reduce((sum, i) => sum + i.recordsToday, 0)
  const wmsConnections = integrations.filter(i => i.type === 'WMS').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WMS Integrations</h1>
            <p className="text-gray-500 dark:text-gray-400">Connect to external WMS, ERP, and TMS systems</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">WMS Connections</p>
              <p className="text-3xl font-bold text-green-600">{wmsConnections}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Warehouse className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connected Systems</p>
              <p className="text-3xl font-bold text-blue-600">{connectedSystems}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Link className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Records Today</p>
              <p className="text-3xl font-bold text-purple-600">{totalRecordsToday.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ArrowRightLeft className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
              <p className="text-3xl font-bold text-red-600">
                {integrations.filter(i => i.status === 'error').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4 px-6">
            {[
              { id: 'systems', label: 'Active Connections', icon: Server },
              { id: 'connectors', label: 'WMS Connectors', icon: Warehouse },
              { id: 'mappings', label: 'Data Mappings', icon: FileJson },
              { id: 'logs', label: 'Sync Logs', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Active Connections Tab */}
          {activeTab === 'systems' && (
            <div className="space-y-4">
              {integrationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-12">
                  <Unlink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No integrations configured</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Your First Integration
                  </button>
                </div>
              ) : (
                integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {integration.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(integration.type)}`}>
                            {integration.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(integration.status)}`}>
                            {getStatusIcon(integration.status)}
                            <span>{integration.status}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Method:</span>
                            <span className="ml-2 text-gray-900 dark:text-white font-medium">
                              {integration.method}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Data Flow:</span>
                            <span className="ml-2 text-gray-900 dark:text-white capitalize">
                              {integration.dataFlow}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {integration.syncFrequency}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Last Sync:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {integration.lastSync ? new Date(integration.lastSync).toLocaleTimeString() : 'Never'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Records Today:</span>
                            <span className="ml-2 text-gray-900 dark:text-white font-medium">
                              {integration.recordsToday.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {integration.endpoint && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {integration.endpoint}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => syncNow.mutate(integration.id)}
                          disabled={syncNow.isPending || integration.status === 'syncing'}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncNow.isPending ? 'animate-spin' : ''}`} />
                          Sync Now
                        </button>
                        <button
                          onClick={() => testConnection.mutate(integration.id)}
                          disabled={testConnection.isPending}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => {
                            setConfigIntegration(integration)
                            setShowConfigModal(true)
                          }}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* WMS Connectors Tab */}
          {activeTab === 'connectors' && (
            <div className="space-y-6">
              {/* Popular Connectors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular WMS Systems</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {WMS_CONNECTORS.filter(c => c.popular).map((connector) => (
                    <div
                      key={connector.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedConnector(connector)
                        setShowAddModal(true)
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {connector.logo}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{connector.name}</h4>
                          <p className="text-xs text-gray-500">{connector.methods.join(', ')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{connector.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {connector.features.slice(0, 3).map((feature) => (
                          <span key={feature} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Connectors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Supported Systems</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {WMS_CONNECTORS.filter(c => !c.popular).map((connector) => (
                    <div
                      key={connector.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedConnector(connector)
                        setShowAddModal(true)
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-sm">
                          {connector.logo}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{connector.name}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{connector.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Import Options */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Manual Data Import</h3>
                <p className="text-blue-100 mb-4">
                  Import inventory snapshots, cycle counts, and adjustments from CSV or Excel files
                </p>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mappings Tab */}
          {activeTab === 'mappings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Source System
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Source Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Target Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Transformation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dataMappings.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {mapping.sourceSystem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {mapping.sourceField}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {mapping.targetField}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {mapping.transformation || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mapping.active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {mapping.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 dark:text-blue-400 hover:underline mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 dark:text-red-400 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus className="w-4 h-4" />
                  Add Field Mapping
                </button>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No sync logs available</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-lg p-4 ${
                      log.status === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                      log.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : log.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {log.integrationName}
                          </p>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {log.message}
                        </p>
                        {log.recordCount > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {log.recordCount.toLocaleString()} records processed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedConnector ? `Connect ${selectedConnector.name}` : 'Add Integration'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedConnector(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>

            {selectedConnector ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    placeholder={`${selectedConnector.name} - Primary`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connection Method
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {selectedConnector.methods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Endpoint / Host
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.example.com/v1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username / Client ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password / Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sync Frequency
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="realtime">Real-time</option>
                    <option value="5min">Every 5 minutes</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="manual">Manual only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data to Sync
                  </label>
                  <div className="space-y-2">
                    {selectedConnector.features.map((feature) => (
                      <label key={feature} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedConnector(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Test & Connect
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {WMS_CONNECTORS.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => setSelectedConnector(connector)}
                    className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {connector.logo}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{connector.name}</p>
                      <p className="text-xs text-gray-500">{connector.methods[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && configIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configure {configIntegration.name}
              </h2>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  setConfigIntegration(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enable Integration</p>
                  <p className="text-sm text-gray-500">Turn sync on or off</p>
                </div>
                <button
                  onClick={() => toggleIntegration.mutate({
                    id: configIntegration.id,
                    enabled: configIntegration.status === 'disabled'
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    configIntegration.status !== 'disabled' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      configIntegration.status !== 'disabled' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConfigModal(false)
                    setConfigIntegration(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
