import { useState } from 'react'
import { Package, ClipboardList, TruckIcon, Users, RefreshCw, AlertCircle } from 'lucide-react'
import { useTaskList, useTaskSummary, useStartTask, useCompleteTask } from '../hooks/useTasks'
import { StatusBadge, PriorityBadge } from '../components/shared'

export default function Picking() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'staging'>('tasks')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Fetch picking tasks from API
  const {
    data: tasksResponse,
    isLoading,
    isError,
    refetch
  } = useTaskList({
    type: 'PICKING',
    status: statusFilter || undefined,
    limit: 50
  })

  // Fetch task summary
  const { data: summary } = useTaskSummary()

  // Mutations for task actions
  const startTaskMutation = useStartTask()
  const completeTaskMutation = useCompleteTask()

  const tasks = tasksResponse?.data || []

  // Calculate stats from real data
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completedTodayTasks = tasks.filter(t => {
    if (t.status !== 'COMPLETED' || !t.completedAt) return false
    const today = new Date().toDateString()
    return new Date(t.completedAt).toDateString() === today
  }).length

  const handleStartTask = async (taskId: string) => {
    try {
      await startTaskMutation.mutateAsync(taskId)
    } catch {
      // Error handled by mutation
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId })
    } catch {
      // Error handled by mutation
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load picking tasks</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Picking & Outbound</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage picking tasks and outbound shipments
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : pendingTasks}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : inProgressTasks}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Package className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : completedTodayTasks}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TruckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {isLoading ? '...' : summary?.byType?.PICKING || tasks.length}
              </p>
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
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Picking Tasks
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
          {/* Picking Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              {/* Filters */}
              <div className="mb-4 flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Picking Tasks
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {statusFilter ? 'No tasks match the selected filter' : 'No picking tasks available'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Task #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Priority
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
                      {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {task.taskNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {task.orderNumber || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {task.fromLocationCode || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <div className="font-medium">{task.productSku || '-'}</div>
                              {task.productName && (
                                <div className="text-xs text-gray-500">{task.productName}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {task.quantityCompleted !== undefined && task.quantity ? (
                              <span>{task.quantityCompleted}/{task.quantity}</span>
                            ) : (
                              task.quantity || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {task.assignedToName || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {task.status === 'PENDING' && (
                                <button
                                  onClick={() => handleStartTask(task.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                  disabled={startTaskMutation.isPending}
                                >
                                  Start
                                </button>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="text-green-600 dark:text-green-400 hover:underline"
                                  disabled={completeTaskMutation.isPending}
                                >
                                  Complete
                                </button>
                              )}
                              <button className="text-gray-600 dark:text-gray-400 hover:underline">
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
