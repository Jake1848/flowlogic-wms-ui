import { AlertTriangle, Info, X, Bell, AlertCircle } from 'lucide-react'
import { useWMSStore } from '../store/useWMSStore'
import type { Alert } from '../store/useWMSStore'

export default function AlertsPanel() {
  const { alerts, removeAlert } = useWMSStore()

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getAlertConfig = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-300',
          icon: 'text-red-500 dark:text-red-400',
          badge: 'bg-red-500',
        }
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-800 dark:text-amber-300',
          icon: 'text-amber-500 dark:text-amber-400',
          badge: 'bg-amber-500',
        }
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          icon: 'text-blue-500 dark:text-blue-400',
          badge: 'bg-blue-500',
        }
    }
  }

  if (alerts.length === 0) {
    return (
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800 shadow-lg" aria-label="Alerts panel">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alerts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">System notifications</p>
            </div>
          </div>

          <div className="text-center py-12" role="status">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No active alerts</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All systems operating normally</p>
          </div>
        </div>
      </section>
    )
  }

  const criticalCount = alerts.filter(a => a.type === 'critical').length
  const warningCount = alerts.filter(a => a.type === 'warning').length

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800 shadow-lg" aria-label="Alerts panel">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="alerts-heading">
                Alerts
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{alerts.length} active notifications</p>
            </div>
          </div>

          {/* Alert summary badges */}
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                {warningCount} Warning
              </span>
            )}
          </div>
        </div>

        <ul className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide" role="list" aria-labelledby="alerts-heading" aria-live="polite">
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.type)
            return (
              <li
                key={alert.id}
                className={`relative flex items-start gap-4 p-4 rounded-xl border ${config.bg} ${config.border} transition-all hover:shadow-md group`}
                role="alert"
                aria-atomic="true"
              >
                {/* Type indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${config.badge}`} />

                <div className={`flex-shrink-0 mt-0.5 ${config.icon}`} aria-hidden="true">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${config.text}`}>{alert.message}</p>
                  <div className={`flex items-center flex-wrap gap-2 mt-2 text-xs opacity-75 ${config.text}`}>
                    <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    {alert.location && (
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded">
                        {alert.location}
                      </span>
                    )}
                    {alert.sku && (
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded font-mono">
                        {alert.sku}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeAlert(alert.id)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Dismiss alert: ${alert.message}`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
