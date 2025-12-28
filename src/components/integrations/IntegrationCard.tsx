import { CheckCircle, AlertCircle, Clock, RefreshCw, Pause, Settings } from 'lucide-react'
import type { Integration } from '../../types/integrations'

interface IntegrationCardProps {
  integration: Integration
  onSyncNow: (id: string) => void
  onTestConnection: (id: string) => void
  onConfigure: (integration: Integration) => void
  isSyncing: boolean
  isTesting: boolean
}

function getStatusColor(status: Integration['status']) {
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

function getStatusIcon(status: Integration['status']) {
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

function getTypeColor(type: Integration['type']) {
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

export function IntegrationCard({
  integration,
  onSyncNow,
  onTestConnection,
  onConfigure,
  isSyncing,
  isTesting
}: IntegrationCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
            onClick={() => onSyncNow(integration.id)}
            disabled={isSyncing || integration.status === 'syncing'}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
          <button
            onClick={() => onTestConnection(integration.id)}
            disabled={isTesting}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Test
          </button>
          <button
            onClick={() => onConfigure(integration)}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
