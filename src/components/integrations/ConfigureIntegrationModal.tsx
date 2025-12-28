import { Trash2 } from 'lucide-react'
import type { Integration } from '../../types/integrations'

interface ConfigureIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  integration: Integration | null
  onToggle: (id: string, enabled: boolean) => void
}

export function ConfigureIntegrationModal({
  isOpen,
  onClose,
  integration,
  onToggle
}: ConfigureIntegrationModalProps) {
  if (!isOpen || !integration) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Configure {integration.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Integration</p>
              <p className="text-sm text-gray-500">Turn sync on or off</p>
            </div>
            <button
              onClick={() => onToggle(integration.id, integration.status === 'disabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                integration.status !== 'disabled' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  integration.status !== 'disabled' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Close
            </button>
            <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
