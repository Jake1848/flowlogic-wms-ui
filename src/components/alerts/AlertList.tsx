import { motion } from 'framer-motion'
import { Filter, Loader2, CheckCircle, Clock, MapPin, AlertCircle, Package } from 'lucide-react'
import { getSeverityInfo, getCategoryInfo, ALERT_SEVERITIES, ALERT_CATEGORIES } from '../../types/alerts'
import type { Alert } from '../../hooks/useAlerts'

interface AlertListProps {
  alerts: Alert[]
  isLoading: boolean
  error: Error | null
  filterSeverity: string
  filterCategory: string
  showAcknowledged: boolean
  onFilterSeverityChange: (value: string) => void
  onFilterCategoryChange: (value: string) => void
  onShowAcknowledgedChange: (value: boolean) => void
  onSelectAlert: (alert: Alert) => void
  onAcknowledge: (alertId: string) => void
}

export function AlertList({
  alerts,
  isLoading,
  error,
  filterSeverity,
  filterCategory,
  showAcknowledged,
  onFilterSeverityChange,
  onFilterCategoryChange,
  onShowAcknowledgedChange,
  onSelectAlert,
  onAcknowledge
}: AlertListProps) {
  const isAcknowledged = (alert: Alert) =>
    alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED' || alert.status === 'DISMISSED'

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    const matchesCategory = filterCategory === 'all' || alert.type === filterCategory
    const matchesAck = showAcknowledged || !isAcknowledged(alert)
    return matchesSeverity && matchesCategory && matchesAck
  })

  return (
    <>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading alerts...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Unable to load from server. Showing demo data.</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => onFilterSeverityChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Severities</option>
            {ALERT_SEVERITIES.map(severity => (
              <option key={severity.id} value={severity.id}>{severity.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategoryChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {ALERT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => onShowAcknowledgedChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Show Acknowledged
          </label>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No alerts matching your filters</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const severityInfo = getSeverityInfo(alert.severity)
              const categoryInfo = getCategoryInfo(alert.type)
              const SeverityIcon = severityInfo?.icon || AlertCircle
              const CategoryIcon = categoryInfo?.icon || Package
              const acknowledged = isAcknowledged(alert)

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                    acknowledged ? 'opacity-60' : ''
                  }`}
                  onClick={() => onSelectAlert(alert)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg border ${severityInfo?.color}`}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                        {acknowledged && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            {alert.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          {categoryInfo?.label || alert.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {alert.referenceNumber && (
                          <span className="flex items-center gap-1 font-mono">
                            <MapPin className="w-3 h-3" />
                            {alert.referenceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    {!acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAcknowledge(alert.id)
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
