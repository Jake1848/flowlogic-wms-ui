import { Warehouse, Link, ArrowRightLeft, AlertCircle } from 'lucide-react'

interface IntegrationSummaryCardsProps {
  wmsConnections: number
  connectedSystems: number
  totalRecordsToday: number
  errorCount: number
}

export function IntegrationSummaryCards({
  wmsConnections,
  connectedSystems,
  totalRecordsToday,
  errorCount
}: IntegrationSummaryCardsProps) {
  return (
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
            <p className="text-3xl font-bold text-red-600">{errorCount}</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
