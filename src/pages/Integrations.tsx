import { useState } from 'react'
import { Database, Plus, Loader2, Unlink, Server, Warehouse, FileJson, Clock } from 'lucide-react'
import { useIntegrations, useSyncLogs, useDataMappings } from '../hooks/useIntegrations'
import {
  IntegrationSummaryCards,
  IntegrationCard,
  WMSConnectorGrid,
  DataMappingsTable,
  SyncLogsPanel,
  AddIntegrationModal,
  ConfigureIntegrationModal
} from '../components/integrations'
import type { Integration, WMSConnector, IntegrationTab } from '../types/integrations'

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('systems')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<WMSConnector | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null)

  const {
    integrations,
    integrationsLoading,
    testConnection,
    syncNow,
    toggleIntegration,
    stats
  } = useIntegrations()

  const { logs, logsLoading } = useSyncLogs(activeTab === 'logs')
  const { mappings } = useDataMappings()

  const tabs = [
    { id: 'systems' as const, label: 'Active Connections', icon: Server },
    { id: 'connectors' as const, label: 'WMS Connectors', icon: Warehouse },
    { id: 'mappings' as const, label: 'Data Mappings', icon: FileJson },
    { id: 'logs' as const, label: 'Sync Logs', icon: Clock }
  ]

  const handleConnectorSelect = (connector: WMSConnector) => {
    setSelectedConnector(connector)
    setShowAddModal(true)
  }

  const handleConfigure = (integration: Integration) => {
    setConfigIntegration(integration)
    setShowConfigModal(true)
  }

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
      <IntegrationSummaryCards
        wmsConnections={stats.wmsConnections}
        connectedSystems={stats.connectedSystems}
        totalRecordsToday={stats.totalRecordsToday}
        errorCount={stats.errorCount}
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onSyncNow={(id) => syncNow.mutate(id)}
                    onTestConnection={(id) => testConnection.mutate(id)}
                    onConfigure={handleConfigure}
                    isSyncing={syncNow.isPending}
                    isTesting={testConnection.isPending}
                  />
                ))
              )}
            </div>
          )}

          {/* WMS Connectors Tab */}
          {activeTab === 'connectors' && (
            <WMSConnectorGrid onSelectConnector={handleConnectorSelect} />
          )}

          {/* Mappings Tab */}
          {activeTab === 'mappings' && (
            <DataMappingsTable mappings={mappings} />
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <SyncLogsPanel logs={logs} isLoading={logsLoading} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddIntegrationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedConnector={selectedConnector}
        onSelectConnector={setSelectedConnector}
      />

      <ConfigureIntegrationModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false)
          setConfigIntegration(null)
        }}
        integration={configIntegration}
        onToggle={(id, enabled) => toggleIntegration.mutate({ id, enabled })}
      />
    </div>
  )
}
