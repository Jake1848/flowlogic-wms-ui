import { useState } from 'react'
import { Package, ClipboardList, TruckIcon, Users } from 'lucide-react'

interface Wave {
  id: string
  waveNumber: string
  priority: 'high' | 'normal' | 'low'
  orderCount: number
  lineCount: number
  status: 'planned' | 'released' | 'picking' | 'completed'
  assignedTo: string[]
  createdAt: string
}

interface PickList {
  id: string
  pickListNumber: string
  waveId: string
  assignedTo: string
  orderNumbers: string[]
  totalLines: number
  pickedLines: number
  status: 'assigned' | 'in_progress' | 'completed' | 'staged'
  zone: string
}

export default function Picking() {
  const [activeTab, setActiveTab] = useState<'waves' | 'picklists' | 'staging'>('waves')

  // Mock Wave data
  const waves: Wave[] = [
    {
      id: '1',
      waveNumber: 'WAVE-2024-1101',
      priority: 'high',
      orderCount: 45,
      lineCount: 234,
      status: 'released',
      assignedTo: ['John D.', 'Sarah M.', 'Mike R.'],
      createdAt: '2024-11-17 08:00',
    },
    {
      id: '2',
      waveNumber: 'WAVE-2024-1102',
      priority: 'normal',
      orderCount: 32,
      lineCount: 156,
      status: 'picking',
      assignedTo: ['Lisa K.', 'Tom B.'],
      createdAt: '2024-11-17 09:30',
    },
    {
      id: '3',
      waveNumber: 'WAVE-2024-1103',
      priority: 'high',
      orderCount: 28,
      lineCount: 189,
      status: 'planned',
      assignedTo: [],
      createdAt: '2024-11-17 10:15',
    },
  ]

  // Mock Pick List data
  const pickLists: PickList[] = [
    {
      id: '1',
      pickListNumber: 'PL-2024-5001',
      waveId: '1',
      assignedTo: 'John D.',
      orderNumbers: ['ORD-10023', 'ORD-10024', 'ORD-10025'],
      totalLines: 45,
      pickedLines: 32,
      status: 'in_progress',
      zone: 'Zone A',
    },
    {
      id: '2',
      pickListNumber: 'PL-2024-5002',
      waveId: '1',
      assignedTo: 'Sarah M.',
      orderNumbers: ['ORD-10026', 'ORD-10027'],
      totalLines: 38,
      pickedLines: 38,
      status: 'completed',
      zone: 'Zone B',
    },
    {
      id: '3',
      pickListNumber: 'PL-2024-5003',
      waveId: '2',
      assignedTo: 'Lisa K.',
      orderNumbers: ['ORD-10028', 'ORD-10029', 'ORD-10030'],
      totalLines: 52,
      pickedLines: 18,
      status: 'in_progress',
      zone: 'Zone C',
    },
  ]

  const getPriorityColor = (priority: Wave['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'normal':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'low':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getWaveStatusColor = (status: Wave['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'picking':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'released':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getPickListStatusColor = (status: PickList['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'staged':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Picking & Outbound</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage waves, pick lists, and outbound shipments
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Create Wave
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Waves</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">5</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pick Lists Open</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">12</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Package className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ready to Ship</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">24</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TruckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pickers Active</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">8</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('waves')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'waves'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Wave Planning
            </button>
            <button
              onClick={() => setActiveTab('picklists')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'picklists'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Pick Lists
            </button>
            <button
              onClick={() => setActiveTab('staging')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'staging'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Staging & Shipping
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Waves Tab */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              {waves.map((wave) => (
                <div
                  key={wave.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {wave.waveNumber}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(wave.priority)}`}>
                          {wave.priority} priority
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWaveStatusColor(wave.status)}`}>
                          {wave.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Orders:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                            {wave.orderCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Lines:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100 font-medium">
                            {wave.lineCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Created:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {wave.createdAt}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Assigned:</span>
                          <span className="ml-2 text-gray-900 dark:text-gray-100">
                            {wave.assignedTo.length > 0 ? wave.assignedTo.join(', ') : 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {wave.status === 'planned' && (
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                          Release
                        </button>
                      )}
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pick Lists Tab */}
          {activeTab === 'picklists' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Pick List #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Zone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Progress
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
                  {pickLists.map((pl) => (
                    <tr key={pl.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {pl.pickListNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {pl.zone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {pl.assignedTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {pl.orderNumbers.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 w-24">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(pl.pickedLines / pl.totalLines) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {pl.pickedLines}/{pl.totalLines}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPickListStatusColor(pl.status)}`}>
                          {pl.status.replace('_', ' ')}
                        </span>
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

          {/* Staging Tab */}
          {activeTab === 'staging' && (
            <div className="text-center py-12">
              <TruckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Staging & Shipping
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Orders ready for staging and shipment will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
