import {
  X,
  Filter,
  Bell,
  AlertOctagon,
  AlertTriangle,
  Lightbulb,
  Clock,
  ChevronRight,
  Search,
  Workflow,
  Trash2,
} from 'lucide-react'
import type { ProactiveAlert, ActionQueueItem } from './types'
import { formatTimeAgo } from './utils'

type AlertFilterType = 'all' | 'critical' | 'warning' | 'prediction'

interface AlertsTabProps {
  alerts: ProactiveAlert[]
  filterAlertType: AlertFilterType
  setFilterAlertType: (type: AlertFilterType) => void
  onMarkAllRead: () => void
  onDismissAlert: (id: string) => void
  onAlertAction: (alert: ProactiveAlert) => void
  actionQueue: ActionQueueItem[]
  onRemoveFromQueue: (id: string) => void
  unreadAlertCount: number
}

export default function AlertsTab({
  alerts,
  filterAlertType,
  setFilterAlertType,
  onMarkAllRead,
  onDismissAlert,
  onAlertAction,
  actionQueue,
  onRemoveFromQueue,
  unreadAlertCount,
}: AlertsTabProps) {
  const filteredAlerts = alerts.filter(
    (a) => filterAlertType === 'all' || a.type === filterAlertType
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex gap-1">
          {(['all', 'critical', 'warning', 'prediction'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterAlertType(type)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterAlertType === type
                  ? type === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : type === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : type === 'prediction'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-violet-500/20 text-violet-400'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        {unreadAlertCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-800">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No alerts to display</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={onDismissAlert}
              onAction={onAlertAction}
            />
          ))
        )}
      </div>

      {/* Action Queue */}
      {actionQueue.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-white">Action Queue</span>
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                {actionQueue.length} pending
              </span>
            </div>
            <button className="text-xs text-emerald-400 hover:text-emerald-300">Execute All</button>
          </div>
          <div className="space-y-2">
            {actionQueue.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.priority === 1
                        ? 'bg-red-400'
                        : item.priority === 2
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-xs text-gray-300">{item.action.title}</span>
                </div>
                <button
                  onClick={() => onRemoveFromQueue(item.id)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface AlertItemProps {
  alert: ProactiveAlert
  onDismiss: (id: string) => void
  onAction: (alert: ProactiveAlert) => void
}

function AlertItem({ alert, onDismiss, onAction }: AlertItemProps) {
  return (
    <div
      className={`p-4 transition-colors ${!alert.isRead ? 'bg-gray-800/30' : ''} hover:bg-gray-800/50`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            alert.type === 'critical'
              ? 'bg-red-500/20'
              : alert.type === 'warning'
              ? 'bg-amber-500/20'
              : alert.type === 'prediction'
              ? 'bg-blue-500/20'
              : 'bg-gray-700'
          }`}
        >
          {alert.type === 'critical' ? (
            <AlertOctagon className="w-4 h-4 text-red-400" />
          ) : alert.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : alert.type === 'prediction' ? (
            <Lightbulb className="w-4 h-4 text-blue-400" />
          ) : (
            <Bell className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium ${!alert.isRead ? 'text-white' : 'text-gray-300'}`}>
                {alert.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-gray-600 hover:text-gray-400 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {alert.metric && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    alert.type === 'critical'
                      ? 'bg-red-500'
                      : alert.type === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min((alert.metric.current / alert.metric.threshold) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {alert.metric.current}/{alert.metric.threshold} {alert.metric.unit}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(alert.timestamp)}
            </span>
            <span className="text-xs text-gray-600">{alert.module}</span>
            {alert.actionRequired && (
              <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                Action required
              </span>
            )}
          </div>

          {alert.suggestedQuery && (
            <button
              onClick={() => onAction(alert)}
              className="mt-3 flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Search className="w-3 h-3" />
              Investigate this issue
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
