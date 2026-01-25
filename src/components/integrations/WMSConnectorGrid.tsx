import { useState } from 'react'
import { Upload, Download, X } from 'lucide-react'
import { WMS_CONNECTORS } from '../../constants/wmsConnectors'
import type { WMSConnector } from '../../types/integrations'
import { DataImport } from './DataImport'

interface WMSConnectorGridProps {
  onSelectConnector: (connector: WMSConnector) => void
}

export function WMSConnectorGrid({ onSelectConnector }: WMSConnectorGridProps) {
  const [showImportModal, setShowImportModal] = useState(false)
  const popularConnectors = WMS_CONNECTORS.filter(c => c.popular)
  const otherConnectors = WMS_CONNECTORS.filter(c => !c.popular)

  return (
    <>
    {/* Import Modal */}
    {showImportModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Data</h2>
            <button
              onClick={() => setShowImportModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            <DataImport />
          </div>
        </div>
      </div>
    )}
    <div className="space-y-6">
      {/* Popular Connectors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular WMS Systems</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularConnectors.map((connector) => (
            <div
              key={connector.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => onSelectConnector(connector)}
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
          {otherConnectors.map((connector) => (
            <div
              key={connector.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => onSelectConnector(connector)}
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
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
