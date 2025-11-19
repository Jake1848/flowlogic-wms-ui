import { useState } from 'react'
import { ClipboardCheck, AlertTriangle, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface QCInspection {
  id: string
  inspectionNumber: string
  type: 'receiving' | 'random' | 'customer_complaint' | 'returns' | 'pre_ship'
  sku: string
  lotNumber?: string
  poNumber?: string
  orderNumber?: string
  inspector: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'on_hold'
  priority: 'high' | 'normal' | 'low'
  createdDate: string
  defectCount: number
  sampleSize: number
}

interface Defect {
  id: string
  category: 'damaged' | 'incorrect_item' | 'missing_parts' | 'quality_issue' | 'labeling' | 'other'
  severity: 'critical' | 'major' | 'minor'
  description: string
  quantity: number
}

export default function QualityControl() {
  const [activeTab, setActiveTab] = useState<'inspections' | 'defects' | 'holds'>('inspections')

  // Mock inspection data
  const inspections: QCInspection[] = [
    {
      id: '1',
      inspectionNumber: 'QC-2024-1001',
      type: 'receiving',
      sku: 'SKU-1023',
      lotNumber: 'LOT-2024-A123',
      poNumber: 'PO-2024-001',
      inspector: 'Sarah Miller',
      status: 'in_progress',
      priority: 'high',
      createdDate: '2024-11-19 14:00',
      defectCount: 0,
      sampleSize: 50,
    },
    {
      id: '2',
      inspectionNumber: 'QC-2024-1002',
      type: 'random',
      sku: 'SKU-2045',
      lotNumber: 'LOT-2024-B456',
      inspector: 'John Doe',
      status: 'passed',
      priority: 'normal',
      createdDate: '2024-11-19 10:30',
      defectCount: 0,
      sampleSize: 25,
    },
    {
      id: '3',
      inspectionNumber: 'QC-2024-1003',
      type: 'customer_complaint',
      sku: 'SKU-5678',
      orderNumber: 'ORD-10025',
      inspector: 'Lisa Kim',
      status: 'failed',
      priority: 'high',
      createdDate: '2024-11-19 09:15',
      defectCount: 8,
      sampleSize: 20,
    },
    {
      id: '4',
      inspectionNumber: 'QC-2024-1004',
      type: 'pre_ship',
      sku: 'SKU-3012',
      orderNumber: 'ORD-10028',
      inspector: 'Mike Roberts',
      status: 'on_hold',
      priority: 'normal',
      createdDate: '2024-11-19 08:45',
      defectCount: 2,
      sampleSize: 30,
    },
  ]

  // Mock defects data
  const defects: Defect[] = [
    {
      id: '1',
      category: 'damaged',
      severity: 'major',
      description: 'Crushed corner on packaging',
      quantity: 5,
    },
    {
      id: '2',
      category: 'incorrect_item',
      severity: 'critical',
      description: 'Wrong color variant received',
      quantity: 12,
    },
    {
      id: '3',
      category: 'labeling',
      severity: 'minor',
      description: 'Barcode print quality poor',
      quantity: 3,
    },
  ]

  const getTypeColor = (type: QCInspection['type']) => {
    switch (type) {
      case 'receiving':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'random':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'customer_complaint':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'returns':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'pre_ship':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    }
  }

  const getStatusColor = (status: QCInspection['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'on_hold':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getSeverityColor = (severity: Defect['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'major':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'minor':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    }
  }

  const passedInspections = inspections.filter(i => i.status === 'passed').length
  const failedInspections = inspections.filter(i => i.status === 'failed').length
  const passRate = inspections.length > 0 ? ((passedInspections / inspections.length) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quality Control</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage inspections, defects, and quality holds
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Create Inspection
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Inspections</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {inspections.filter(i => i.status !== 'passed' && i.status !== 'failed').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ClipboardCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pass Rate</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {passRate}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Failed Inspections</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {failedInspections}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">On Hold</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {inspections.filter(i => i.status === 'on_hold').length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('inspections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'inspections'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Inspections
            </button>
            <button
              onClick={() => setActiveTab('defects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'defects'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Defect Tracking
            </button>
            <button
              onClick={() => setActiveTab('holds')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'holds'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Quality Holds
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Inspections Tab */}
          {activeTab === 'inspections' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Inspection #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Lot/PO/Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Inspector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Defects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Sample Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {inspection.inspectionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(inspection.type)}`}>
                          {inspection.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {inspection.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {inspection.lotNumber || inspection.poNumber || inspection.orderNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {inspection.inspector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inspection.status)}`}>
                          {inspection.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {inspection.defectCount > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">{inspection.defectCount}</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {inspection.sampleSize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 dark:text-blue-400 hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Defects Tab */}
          {activeTab === 'defects' && (
            <div className="space-y-4">
              {defects.map((defect) => (
                <div
                  key={defect.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getSeverityColor(defect.severity)}`}>
                          {defect.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {defect.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{defect.description}</p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Quantity affected: <span className="font-medium">{defect.quantity} units</span>
                      </div>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Holds Tab */}
          {activeTab === 'holds' && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Quality Holds
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Items on quality hold will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
