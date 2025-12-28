import { motion } from 'framer-motion'
import { X, AlertCircle } from 'lucide-react'
import { getSeverityInfo, getCategoryInfo } from '../../types/alerts'
import type { Alert } from '../../hooks/useAlerts'

interface AlertDetailModalProps {
  alert: Alert | null
  onClose: () => void
  onAcknowledge: (alertId: string) => void
}

export function AlertDetailModal({ alert, onClose, onAcknowledge }: AlertDetailModalProps) {
  if (!alert) return null

  const severityInfo = getSeverityInfo(alert.severity)
  const SeverityIcon = severityInfo?.icon || AlertCircle
  const isAcknowledged = alert.status === 'ACKNOWLEDGED' || alert.status === 'RESOLVED' || alert.status === 'DISMISSED'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${severityInfo?.color}`}>
              <SeverityIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{alert.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{alert.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Message</p>
            <p className="text-gray-700 dark:text-gray-300">{alert.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {getCategoryInfo(alert.type)?.label || alert.type}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Severity</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {getSeverityInfo(alert.severity)?.label || alert.severity}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="font-medium text-gray-900 dark:text-white">{alert.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {alert.referenceNumber && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
              <p className="font-mono text-blue-600">{alert.referenceNumber}</p>
            </div>
          )}

          {alert.assignedToName && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
              <p className="font-medium text-gray-900 dark:text-white">{alert.assignedToName}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Close
          </button>
          {!isAcknowledged && (
            <button
              onClick={() => {
                onAcknowledge(alert.id)
                onClose()
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Acknowledge
            </button>
          )}
          {alert.referenceNumber && (
            <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              View Related
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
