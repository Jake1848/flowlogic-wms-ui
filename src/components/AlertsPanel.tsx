import { AlertTriangle, Info, X } from 'lucide-react'
import { useWMSStore } from '../store/useWMSStore'
import type { Alert } from '../store/useWMSStore'

export default function AlertsPanel() {
  const { alerts, removeAlert } = useWMSStore()

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Alerts
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active alerts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Alerts ({alerts.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start space-x-3 p-4 rounded-lg border ${getAlertStyles(
              alert.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{alert.message}</p>
              <div className="flex items-center space-x-2 mt-1 text-xs opacity-75">
                <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                {alert.location && <span>• {alert.location}</span>}
                {alert.sku && <span>• {alert.sku}</span>}
              </div>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
