import { useState } from 'react'
import { Database, ArrowRightLeft, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'

interface Integration {
  id: string
  name: string
  type: 'ERP' | 'TMS' | 'WMS' | 'E-Commerce' | 'Other'
  method: 'REST API' | 'EDI' | 'SFTP' | 'Database' | 'Webhook'
  status: 'connected' | 'error' | 'syncing' | 'disabled'
  lastSync: string
  endpoint?: string
  dataFlow: 'inbound' | 'outbound' | 'bidirectional'
  syncFrequency: string
  recordsToday: number
}

interface DataMapping {
  id: string
  sourceSystem: string
  sourceField: string
  targetField: string
  transformation?: string
  active: boolean
}

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'systems' | 'mappings' | 'logs'>('systems')

  // Mock integration data
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'JD Edwards ERP',
      type: 'ERP',
      method: 'REST API',
      status: 'connected',
      lastSync: '2024-11-19 15:30:00',
      endpoint: 'https://erp.company.com/api/v1',
      dataFlow: 'bidirectional',
      syncFrequency: 'Real-time',
      recordsToday: 1247,
    },
    {
      id: '2',
      name: 'Descartes TMS',
      type: 'TMS',
      method: 'REST API',
      status: 'connected',
      lastSync: '2024-11-19 15:28:45',
      endpoint: 'https://tms.descartes.com/api',
      dataFlow: 'bidirectional',
      syncFrequency: 'Real-time',
      recordsToday: 456,
    },
    {
      id: '3',
      name: 'AS400 Legacy System',
      type: 'ERP',
      method: 'SFTP',
      status: 'syncing',
      lastSync: '2024-11-19 15:15:00',
      endpoint: 'sftp://as400.company.com/data',
      dataFlow: 'bidirectional',
      syncFrequency: 'Every 15 minutes',
      recordsToday: 892,
    },
    {
      id: '4',
      name: 'EDI Partner Network',
      type: 'Other',
      method: 'EDI',
      status: 'connected',
      lastSync: '2024-11-19 15:00:00',
      endpoint: 'EDI VAN: Sterling Commerce',
      dataFlow: 'bidirectional',
      syncFrequency: 'Hourly',
      recordsToday: 234,
    },
    {
      id: '5',
      name: 'Shopify Store',
      type: 'E-Commerce',
      method: 'Webhook',
      status: 'error',
      lastSync: '2024-11-19 12:15:00',
      endpoint: 'https://shopify.com/webhooks',
      dataFlow: 'inbound',
      syncFrequency: 'Real-time',
      recordsToday: 0,
    },
  ]

  // Mock data mappings
  const dataMappings: DataMapping[] = [
    {
      id: '1',
      sourceSystem: 'JD Edwards ERP',
      sourceField: 'PO_NUMBER',
      targetField: 'poNumber',
      transformation: 'Prefix with "PO-"',
      active: true,
    },
    {
      id: '2',
      sourceSystem: 'JD Edwards ERP',
      sourceField: 'ITEM_CODE',
      targetField: 'sku',
      active: true,
    },
    {
      id: '3',
      sourceSystem: 'Descartes TMS',
      sourceField: 'ASN_ID',
      targetField: 'asnNumber',
      transformation: 'Uppercase',
      active: true,
    },
    {
      id: '4',
      sourceSystem: 'AS400 Legacy System',
      sourceField: 'ORDER_NUM',
      targetField: 'orderNumber',
      transformation: 'Pad left with zeros (10 digits)',
      active: true,
    },
  ]

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'syncing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5" />
      case 'syncing':
        return <RefreshCw className="w-5 h-5 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage connections to ERP, TMS, and external systems
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Add Integration
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Systems</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {integrations.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Connected</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {connectedSystems}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Records Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalRecordsToday.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <ArrowRightLeft className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Errors</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {integrations.filter(i => i.status === 'error').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Integration Flow Diagram */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Flow Overview
        </h3>
        <div className="flex items-center justify-center space-x-4 py-8">
          <div className="text-center">
            <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-2">
              <Database className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100">ERP Systems</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Purchase Orders, Items</p>
          </div>

          <ArrowRightLeft className="w-8 h-8 text-gray-400" />

          <div className="text-center">
            <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-2">
              <Database className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100">FlowLogic WMS</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Central Hub</p>
          </div>

          <ArrowRightLeft className="w-8 h-8 text-gray-400" />

          <div className="text-center">
            <div className="w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-2">
              <Database className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100">TMS/Carriers</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Shipping, Tracking</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('systems')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'systems'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Connected Systems
            </button>
            <button
              onClick={() => setActiveTab('mappings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'mappings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Data Mappings
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Sync Logs
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Systems Tab */}
          {activeTab === 'systems' && (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {integration.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(integration.type)}`}>
                          {integration.type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(integration.status)}`}>
                          {getStatusIcon(integration.status)}
                          <span>{integration.status}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Method:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                            {integration.method}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Data Flow:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">
                            {integration.dataFlow}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {integration.syncFrequency}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Last Sync:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {new Date(integration.lastSync).toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Records Today:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                            {integration.recordsToday.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {integration.endpoint && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Endpoint: {integration.endpoint}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                        Configure
                      </button>
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                        Test Connection
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
                        <button className="text-blue-600 dark:text-blue-400 hover:underline">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        JD Edwards ERP - PO Sync Successful
                      </p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">2 min ago</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Synced 45 purchase orders successfully
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Descartes TMS - ASN Update
                      </p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">5 min ago</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Updated 12 ASN records with tracking information
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Shopify Store - Webhook Failed
                      </p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">3 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Connection timeout - retrying in 5 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
