import { useState } from 'react'
import { TrendingDown, ArrowUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface ReplenTask {
  id: string
  taskNumber: string
  sku: string
  fromLocation: string
  toLocation: string
  qtyNeeded: number
  qtyAvailable: number
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed'
  assignedTo?: string
  createdAt: string
  dueBy: string
}

interface ReplenRule {
  id: string
  sku: string
  pickLocation: string
  reserveLocation: string
  minQty: number
  maxQty: number
  replenQty: number
  currentQty: number
  isActive: boolean
}

export default function Replenishment() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'rules' | 'history'>('tasks')

  // Mock replenishment tasks
  const replenTasks: ReplenTask[] = [
    {
      id: '1',
      taskNumber: 'REPLEN-2024-5001',
      sku: 'SKU-1023',
      fromLocation: 'B-12-05-A',
      toLocation: 'A-02-03-C',
      qtyNeeded: 48,
      qtyAvailable: 96,
      priority: 'urgent',
      status: 'pending',
      createdAt: '2024-11-19 15:30',
      dueBy: '2024-11-19 16:00',
    },
    {
      id: '2',
      taskNumber: 'REPLEN-2024-5002',
      sku: 'SKU-2045',
      fromLocation: 'B-08-12-B',
      toLocation: 'A-05-01-C',
      qtyNeeded: 24,
      qtyAvailable: 72,
      priority: 'high',
      status: 'assigned',
      assignedTo: 'John D.',
      createdAt: '2024-11-19 14:15',
      dueBy: '2024-11-19 17:00',
    },
    {
      id: '3',
      taskNumber: 'REPLEN-2024-5003',
      sku: 'SKU-5678',
      fromLocation: 'C-03-08-A',
      toLocation: 'A-08-02-D',
      qtyNeeded: 12,
      qtyAvailable: 36,
      priority: 'normal',
      status: 'in_progress',
      assignedTo: 'Mike R.',
      createdAt: '2024-11-19 13:00',
      dueBy: '2024-11-19 18:00',
    },
    {
      id: '4',
      taskNumber: 'REPLEN-2024-5004',
      sku: 'SKU-3012',
      fromLocation: 'B-15-04-C',
      toLocation: 'A-03-07-B',
      qtyNeeded: 32,
      qtyAvailable: 64,
      priority: 'normal',
      status: 'completed',
      assignedTo: 'Sarah M.',
      createdAt: '2024-11-19 10:30',
      dueBy: '2024-11-19 15:00',
    },
  ]

  // Mock replenishment rules
  const replenRules: ReplenRule[] = [
    {
      id: '1',
      sku: 'SKU-1023',
      pickLocation: 'A-02-03-C',
      reserveLocation: 'B-12-05-A',
      minQty: 24,
      maxQty: 96,
      replenQty: 48,
      currentQty: 18,
      isActive: true,
    },
    {
      id: '2',
      sku: 'SKU-2045',
      pickLocation: 'A-05-01-C',
      reserveLocation: 'B-08-12-B',
      minQty: 12,
      maxQty: 48,
      replenQty: 24,
      currentQty: 36,
      isActive: true,
    },
    {
      id: '3',
      sku: 'SKU-3012',
      pickLocation: 'A-03-07-B',
      reserveLocation: 'B-15-04-C',
      minQty: 16,
      maxQty: 64,
      replenQty: 32,
      currentQty: 52,
      isActive: true,
    },
  ]

  const getPriorityColor = (priority: ReplenTask['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'normal':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'low':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: ReplenTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'assigned':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const urgentTasks = replenTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  const activeTasks = replenTasks.filter(t => t.status !== 'completed').length
  const completedToday = replenTasks.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Replenishment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage pick location replenishment and min/max rules
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Create Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Urgent Tasks</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {urgentTasks}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {activeTasks}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ArrowUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {completedToday}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Rules</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {replenRules.filter(r => r.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingDown className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Min/Max Rules
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Task #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      From Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      To Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Qty Needed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Due By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {replenTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {task.taskNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {task.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {task.fromLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {task.toLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {task.qtyNeeded}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {task.assignedTo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(task.dueBy).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Pick Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Reserve Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Current Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Min Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Max Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Replen Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {replenRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rule.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {rule.pickLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {rule.reserveLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            rule.currentQty < rule.minQty
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {rule.currentQty}
                          </span>
                          {rule.currentQty < rule.minQty && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {rule.minQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {rule.maxQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {rule.replenQty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Replenishment History
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Historical replenishment data will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
