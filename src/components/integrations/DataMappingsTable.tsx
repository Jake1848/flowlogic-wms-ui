import { Plus } from 'lucide-react'
import type { DataMapping } from '../../types/integrations'

interface DataMappingsTableProps {
  mappings: DataMapping[]
  onEdit?: (mapping: DataMapping) => void
  onDelete?: (mapping: DataMapping) => void
  onAdd?: () => void
}

export function DataMappingsTable({ mappings, onEdit, onDelete, onAdd }: DataMappingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Source System
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Source Field
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Target Field
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Transformation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {mappings.map((mapping) => (
            <tr key={mapping.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {mapping.sourceSystem}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                {mapping.sourceField}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                {mapping.targetField}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {mapping.transformation || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  mapping.active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {mapping.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onEdit?.(mapping)}
                  className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(mapping)}
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Plus className="w-4 h-4" />
          Add Field Mapping
        </button>
      </div>
    </div>
  )
}
