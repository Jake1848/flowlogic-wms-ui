import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Filter,
  RefreshCw,
  AlertTriangle,
  Zap,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTaskList, useTaskSummary, useStartTask, useCompleteTask, type Task } from '../hooks/useTasks';

// Task types (matches API Task.type values)
const TASK_TYPES = [
  { id: 'PICKING', label: 'Picking', color: 'bg-blue-100 text-blue-800', icon: '📦' },
  { id: 'PUTAWAY', label: 'Putaway', color: 'bg-green-100 text-green-800', icon: '📥' },
  { id: 'REPLENISHMENT', label: 'Replenishment', color: 'bg-purple-100 text-purple-800', icon: '🔄' },
  { id: 'MOVE', label: 'Move', color: 'bg-yellow-100 text-yellow-800', icon: '➡️' },
  { id: 'CYCLE_COUNT', label: 'Cycle Count', color: 'bg-orange-100 text-orange-800', icon: '📋' },
  { id: 'RECEIVE', label: 'Receive', color: 'bg-teal-100 text-teal-800', icon: '📥' },
  { id: 'SHIP', label: 'Ship', color: 'bg-indigo-100 text-indigo-800', icon: '📤' },
  { id: 'PACK', label: 'Pack', color: 'bg-pink-100 text-pink-800', icon: '📦' },
  { id: 'TRANSFER', label: 'Transfer', color: 'bg-cyan-100 text-cyan-800', icon: '↔️' },
  { id: 'ADJUSTMENT', label: 'Adjustment', color: 'bg-gray-100 text-gray-800', icon: '📝' },
];

// Priority levels (API uses numeric 1-4, 1 being highest)
const PRIORITIES = [
  { id: 1, label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: 2, label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: 3, label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: 4, label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

// Mock tasks (fallback when API unavailable)
const mockTasks: Task[] = [
  {
    id: 'TSK-001',
    taskNumber: 'TSK-001',
    type: 'PICKING',
    priority: 1,
    status: 'IN_PROGRESS',
    warehouseId: 'WH-001',
    assignedToId: 'EMP-1042',
    assignedToName: 'John Smith',
    fromLocationCode: 'A-12-03',
    toLocationCode: 'STAGE-01',
    productSku: 'SKU-10045',
    productName: 'Wireless Headphones',
    quantity: 24,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:15:00Z',
    startedAt: '2024-01-15T08:15:00Z',
  },
  {
    id: 'TSK-002',
    taskNumber: 'TSK-002',
    type: 'PUTAWAY',
    priority: 2,
    status: 'PENDING',
    warehouseId: 'WH-001',
    fromLocationCode: 'RCV-01',
    toLocationCode: 'R-05-12',
    productSku: 'SKU-20089',
    productName: 'USB-C Cable',
    quantity: 48,
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'TSK-003',
    taskNumber: 'TSK-003',
    type: 'REPLENISHMENT',
    priority: 2,
    status: 'PENDING',
    warehouseId: 'WH-001',
    fromLocationCode: 'R-08-24',
    toLocationCode: 'A-15-01',
    productSku: 'SKU-30156',
    productName: 'Laptop Stand',
    quantity: 12,
    createdAt: '2024-01-15T07:45:00Z',
    updatedAt: '2024-01-15T07:45:00Z',
  },
  {
    id: 'TSK-004',
    taskNumber: 'TSK-004',
    type: 'PICKING',
    priority: 3,
    status: 'IN_PROGRESS',
    warehouseId: 'WH-001',
    assignedToId: 'EMP-1089',
    assignedToName: 'Maria Garcia',
    fromLocationCode: 'B-05-08',
    toLocationCode: 'STAGE-02',
    productSku: 'SKU-40221',
    productName: 'Mechanical Keyboard',
    quantity: 6,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:20:00Z',
    startedAt: '2024-01-15T08:20:00Z',
  },
  {
    id: 'TSK-005',
    taskNumber: 'TSK-005',
    type: 'MOVE',
    priority: 4,
    status: 'PENDING',
    warehouseId: 'WH-001',
    fromLocationCode: 'C-04-02',
    toLocationCode: 'C-08-01',
    productSku: 'SKU-50332',
    productName: 'Monitor Arm',
    quantity: 8,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'TSK-006',
    taskNumber: 'TSK-006',
    type: 'CYCLE_COUNT',
    priority: 3,
    status: 'COMPLETED',
    warehouseId: 'WH-001',
    assignedToId: 'EMP-1056',
    assignedToName: 'Robert Chen',
    fromLocationCode: 'D-02-01',
    productSku: 'SKU-60445',
    productName: 'Webcam HD',
    createdAt: '2024-01-15T07:00:00Z',
    updatedAt: '2024-01-15T07:25:00Z',
    startedAt: '2024-01-15T07:15:00Z',
    completedAt: '2024-01-15T07:25:00Z',
  },
];

// Task productivity data
const productivityData = [
  { hour: '06:00', picks: 45, putaways: 12, replens: 8 },
  { hour: '07:00', picks: 78, putaways: 24, replens: 15 },
  { hour: '08:00', picks: 92, putaways: 35, replens: 22 },
  { hour: '09:00', picks: 85, putaways: 28, replens: 18 },
  { hour: '10:00', picks: 65, putaways: 20, replens: 12 },
];

// Worker productivity
const workerProductivity = [
  { name: 'John Smith', tasks: 42, efficiency: 98 },
  { name: 'Maria Garcia', tasks: 38, efficiency: 95 },
  { name: 'Robert Chen', tasks: 35, efficiency: 92 },
  { name: 'Sarah Johnson', tasks: 31, efficiency: 89 },
  { name: 'Mike Williams', tasks: 28, efficiency: 87 },
];

export default function TaskManagement() {
  const [activeTab, setActiveTab] = useState<'queue' | 'active' | 'analytics'>('queue');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks from API
  const { data: taskData, isLoading, error } = useTaskList({
    type: filterType !== 'all' ? filterType : undefined,
    priority: filterPriority !== 'all' ? Number(filterPriority) : undefined,
  });
  const { data: taskSummary } = useTaskSummary();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();

  // Use API data with fallback to mock data
  const tasks: Task[] = taskData?.data || mockTasks;

  const getTaskTypeInfo = (typeId: string) => TASK_TYPES.find(t => t.id === typeId);
  const getPriorityInfo = (priorityId: number) => PRIORITIES.find(p => p.id === priorityId);

  const filteredTasks = tasks.filter(task => {
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesPriority = filterPriority === 'all' || task.priority === Number(filterPriority);
    return matchesType && matchesPriority;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING');
  const activeTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');

  // Use API summary or calculate from tasks
  const completedToday = taskSummary?.completed ?? tasks.filter(t => t.status === 'COMPLETED').length;
  const criticalTasks = tasks.filter(t => t.priority === 1 && t.status !== 'COMPLETED').length;

  const handleStartTask = (taskId: string) => {
    startTask.mutate(taskId);
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask.mutate({ taskId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage work queue and task assignments</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Zap className="w-4 h-4" />
            Interleave Tasks
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tasks...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Unable to load from server. Showing demo data.</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{activeTasks.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">{completedToday}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical Tasks</p>
              <p className="text-2xl font-bold text-red-600">{criticalTasks}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Completion</p>
              <p className="text-2xl font-bold text-gray-900">4.2 min</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'queue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Task Queue ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Tasks ({activeTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          {(activeTab === 'queue' || activeTab === 'active') && (
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  {TASK_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No pending tasks in queue
                </div>
              ) : (
                pendingTasks.map((task) => {
                  const typeInfo = getTaskTypeInfo(task.type);
                  const priorityInfo = getPriorityInfo(task.priority);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer bg-white dark:bg-gray-800"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-12 rounded ${priorityInfo?.color}`}></div>
                          <span className="text-2xl">{typeInfo?.icon || '📋'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{task.taskNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo?.color}`}>
                                {typeInfo?.label || task.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityInfo?.textColor} bg-opacity-10`}>
                                {priorityInfo?.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{task.productName || task.productSku} • Qty: {task.quantity || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {task.fromLocationCode || 'N/A'} → {task.toLocationCode || 'N/A'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTask(task.id);
                            }}
                            className="mt-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Start Task
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* Active Tab */}
          {activeTab === 'active' && (
            <div className="space-y-3">
              {activeTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No active tasks
                </div>
              ) : (
                activeTasks.map((task) => {
                  const typeInfo = getTaskTypeInfo(task.type);
                  const priorityInfo = getPriorityInfo(task.priority);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-12 rounded ${priorityInfo?.color}`}></div>
                          <span className="text-2xl">{typeInfo?.icon || '📋'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{task.taskNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo?.color}`}>
                                {typeInfo?.label || task.type}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                                In Progress
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{task.productName || task.productSku} • Qty: {task.quantity || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <User className="w-3 h-3" />
                            {task.assignedToName || 'Unassigned'}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Started: {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : 'N/A'}
                          </p>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="mt-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Productivity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Hourly Task Completion</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="picks" fill="#3B82F6" name="Picks" />
                      <Bar dataKey="putaways" fill="#10B981" name="Putaways" />
                      <Bar dataKey="replens" fill="#8B5CF6" name="Replens" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Worker Leaderboard */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {workerProductivity.map((worker, idx) => (
                      <div key={worker.name} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{worker.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{worker.tasks} tasks</span>
                            <span>•</span>
                            <span>{worker.efficiency}% efficiency</span>
                          </div>
                        </div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${worker.efficiency}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTask.taskNumber}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTaskTypeInfo(selectedTask.type)?.color}`}>
                {getTaskTypeInfo(selectedTask.type)?.label || selectedTask.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">SKU</p>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedTask.productSku || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTask.quantity || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">From</p>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedTask.fromLocationCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">To</p>
                <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedTask.toLocationCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTask.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                <p className={`font-medium ${getPriorityInfo(selectedTask.priority)?.textColor}`}>
                  {getPriorityInfo(selectedTask.priority)?.label || `Priority ${selectedTask.priority}`}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Product</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTask.productName || selectedTask.productSku || 'N/A'}</p>
            </div>

            {selectedTask.assignedToName && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTask.assignedToName}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              {selectedTask.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleStartTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Task
                </button>
              )}
              {selectedTask.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Complete Task
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
