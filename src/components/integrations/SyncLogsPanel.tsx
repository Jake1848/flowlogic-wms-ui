import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import type { SyncLog } from '../../types/integrations'

interface SyncLogsPanelProps {
  logs: SyncLog[]
  isLoading: boolean
}

export function SyncLogsPanel({ logs, isLoading }: SyncLogsPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No sync logs available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
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
      ))}
    </div>
  )
}
