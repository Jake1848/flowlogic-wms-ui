import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Filter,
  MapPin,
  Calendar,
  TrendingUp,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTaskList, useTaskSummary, useStartTask, useCompleteTask } from '../hooks/useTasks';
import { StatusBadge, PriorityBadge } from '../components/shared';

// Cycle count types
const COUNT_TYPES = [
  { id: 'abc', label: 'ABC Analysis', description: 'Count based on item value/velocity classification' },
  { id: 'location', label: 'Location-Based', description: 'Count all items in specific locations' },
  { id: 'random', label: 'Random Sample', description: 'Randomly selected locations for counting' },
  { id: 'negative', label: 'Negative Inventory', description: 'Items showing negative or zero inventory' },
  { id: 'variance', label: 'Variance Recount', description: 'Recount items with previous variances' },
];

// ABC Classification
const ABC_CLASSES = [
  { class: 'A', description: 'High value/velocity', countFrequency: 'Weekly', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
  { class: 'B', description: 'Medium value/velocity', countFrequency: 'Monthly', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
  { class: 'C', description: 'Low value/velocity', countFrequency: 'Quarterly', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
];

// Accuracy trend data (placeholder for analytics)
const accuracyTrend = [
  { week: 'W1', accuracy: 96.2, counts: 145 },
  { week: 'W2', accuracy: 97.1, counts: 162 },
  { week: 'W3', accuracy: 95.8, counts: 138 },
  { week: 'W4', accuracy: 98.2, counts: 171 },
  { week: 'W5', accuracy: 97.5, counts: 155 },
  { week: 'W6', accuracy: 98.8, counts: 168 },
];

// Zone accuracy data (placeholder for analytics)
const zoneAccuracy = [
  { zone: 'Zone A', accuracy: 98.5, counts: 245 },
  { zone: 'Zone B', accuracy: 97.2, counts: 312 },
  { zone: 'Zone C', accuracy: 96.8, counts: 198 },
  { zone: 'Zone D', accuracy: 99.1, counts: 156 },
  { zone: 'Reserve', accuracy: 95.4, counts: 89 },
];

export default function CycleCounting() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedule' | 'analytics'>('tasks');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Fetch cycle count tasks from API
  const {
    data: tasksResponse,
    isLoading,
    isError,
    refetch
  } = useTaskList({
    type: 'CYCLE_COUNT',
    status: filterStatus || undefined,
    limit: 50
  });

  // Fetch task summary
  const { data: summary } = useTaskSummary();

  // Mutations
  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTask();

  const tasks = tasksResponse?.data || [];

  // Calculate stats from real data
  const todaysTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;

  const handleStartTask = async (taskId: string) => {
    try {
      await startTaskMutation.mutateAsync(taskId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTaskMutation.mutateAsync({ taskId });
    } catch {
      // Error handled by mutation
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load cycle count tasks</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cycle Counting</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage inventory counts and accuracy tracking</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Counts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : todaysTasks}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {completedTasks} completed, {pendingTasks} pending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {isLoading ? '...' : inProgressTasks}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <RefreshCw className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Active counts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Accuracy</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">98.2%</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">+0.5% vs last week</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : summary?.byType?.CYCLE_COUNT || tasks.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This month</p>
        </motion.div>
      </div>

      {/* ABC Classification Reference */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">ABC Classification Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ABC_CLASSES.map((abc) => (
            <div key={abc.class} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${abc.color}`}>
                {abc.class}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{abc.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Count: {abc.countFrequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Count Tasks
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Task List */}
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Cycle Count Tasks
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filterStatus ? 'No tasks match the selected filter' : 'No cycle count tasks available'}
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
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Product
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
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

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">January 2024</span>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Scheduled Count Types</h4>
                <div className="space-y-2">
                  {COUNT_TYPES.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{type.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                      </div>
                      <button className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                        Configure
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Accuracy Trend */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Inventory Accuracy Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={accuracyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[94, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                      <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Zone Accuracy */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Accuracy by Zone</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={zoneAccuracy}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis domain={[94, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                      <Bar dataKey="accuracy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
