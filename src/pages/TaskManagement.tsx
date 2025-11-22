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
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Task types
const TASK_TYPES = [
  { id: 'pick', label: 'Pick', color: 'bg-blue-100 text-blue-800', icon: '📦' },
  { id: 'putaway', label: 'Putaway', color: 'bg-green-100 text-green-800', icon: '📥' },
  { id: 'replen', label: 'Replenishment', color: 'bg-purple-100 text-purple-800', icon: '🔄' },
  { id: 'move', label: 'Move', color: 'bg-yellow-100 text-yellow-800', icon: '➡️' },
  { id: 'count', label: 'Cycle Count', color: 'bg-orange-100 text-orange-800', icon: '📋' },
  { id: 'load', label: 'Loading', color: 'bg-teal-100 text-teal-800', icon: '🚛' },
  { id: 'unload', label: 'Unloading', color: 'bg-indigo-100 text-indigo-800', icon: '📤' },
];

// Priority levels
const PRIORITIES = [
  { id: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: 'normal', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: 'low', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

// Mock tasks in queue
const mockTasks = [
  {
    id: 'TSK-001',
    type: 'pick',
    priority: 'critical',
    status: 'in_progress',
    assignee: 'John Smith',
    assigneeId: 'EMP-1042',
    fromLocation: 'A-12-03',
    toLocation: 'STAGE-01',
    sku: 'SKU-10045',
    description: 'Wireless Headphones',
    quantity: 24,
    wave: 'WAVE-001',
    createdAt: '2024-01-15 08:00',
    startedAt: '2024-01-15 08:15',
    equipment: 'RF-Gun'
  },
  {
    id: 'TSK-002',
    type: 'putaway',
    priority: 'high',
    status: 'pending',
    assignee: null,
    assigneeId: null,
    fromLocation: 'RCV-01',
    toLocation: 'R-05-12',
    sku: 'SKU-20089',
    description: 'USB-C Cable',
    quantity: 48,
    wave: null,
    createdAt: '2024-01-15 09:30',
    startedAt: null,
    equipment: 'Forklift'
  },
  {
    id: 'TSK-003',
    type: 'replen',
    priority: 'high',
    status: 'pending',
    assignee: null,
    assigneeId: null,
    fromLocation: 'R-08-24',
    toLocation: 'A-15-01',
    sku: 'SKU-30156',
    description: 'Laptop Stand',
    quantity: 12,
    wave: null,
    createdAt: '2024-01-15 07:45',
    startedAt: null,
    equipment: 'Pallet Jack'
  },
  {
    id: 'TSK-004',
    type: 'pick',
    priority: 'normal',
    status: 'in_progress',
    assignee: 'Maria Garcia',
    assigneeId: 'EMP-1089',
    fromLocation: 'B-05-08',
    toLocation: 'STAGE-02',
    sku: 'SKU-40221',
    description: 'Mechanical Keyboard',
    quantity: 6,
    wave: 'WAVE-001',
    createdAt: '2024-01-15 08:00',
    startedAt: '2024-01-15 08:20',
    equipment: 'RF-Gun'
  },
  {
    id: 'TSK-005',
    type: 'move',
    priority: 'low',
    status: 'pending',
    assignee: null,
    assigneeId: null,
    fromLocation: 'C-04-02',
    toLocation: 'C-08-01',
    sku: 'SKU-50332',
    description: 'Monitor Arm',
    quantity: 8,
    wave: null,
    createdAt: '2024-01-15 10:00',
    startedAt: null,
    equipment: 'Forklift'
  },
  {
    id: 'TSK-006',
    type: 'count',
    priority: 'normal',
    status: 'completed',
    assignee: 'Robert Chen',
    assigneeId: 'EMP-1056',
    fromLocation: 'D-02-01',
    toLocation: null,
    sku: 'SKU-60445',
    description: 'Webcam HD',
    quantity: null,
    wave: null,
    createdAt: '2024-01-15 07:00',
    startedAt: '2024-01-15 07:15',
    completedAt: '2024-01-15 07:25',
    equipment: 'RF-Gun'
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
  const [selectedTask, setSelectedTask] = useState<typeof mockTasks[0] | null>(null);

  const getTaskTypeInfo = (typeId: string) => TASK_TYPES.find(t => t.id === typeId);
  const getPriorityInfo = (priorityId: string) => PRIORITIES.find(p => p.id === priorityId);

  const filteredTasks = mockTasks.filter(task => {
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const activeTasks = filteredTasks.filter(t => t.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500 mt-1">Manage work queue and task assignments</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Zap className="w-4 h-4" />
            Interleave Tasks
          </button>
        </div>
      </div>

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
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">156</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Tasks</p>
              <p className="text-2xl font-bold text-red-600">
                {mockTasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
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
                <div className="text-center py-8 text-gray-500">
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
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-12 rounded ${priorityInfo?.color}`}></div>
                          <span className="text-2xl">{typeInfo?.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{task.id}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo?.color}`}>
                                {typeInfo?.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityInfo?.textColor} bg-opacity-10`}>
                                {priorityInfo?.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{task.description} • Qty: {task.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {task.fromLocation} → {task.toLocation || 'N/A'}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{task.equipment}</p>
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
                <div className="text-center py-8 text-gray-500">
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
                      className="border border-blue-200 bg-blue-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-12 rounded ${priorityInfo?.color}`}></div>
                          <span className="text-2xl">{typeInfo?.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{task.id}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo?.color}`}>
                                {typeInfo?.label}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                In Progress
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{task.description} • Qty: {task.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Started: {task.startedAt}</p>
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
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{selectedTask.id}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTaskTypeInfo(selectedTask.type)?.color}`}>
                {getTaskTypeInfo(selectedTask.type)?.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">SKU</p>
                <p className="font-mono font-medium">{selectedTask.sku}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="font-medium">{selectedTask.quantity || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">From</p>
                <p className="font-mono font-medium">{selectedTask.fromLocation}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">To</p>
                <p className="font-mono font-medium">{selectedTask.toLocation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Equipment</p>
                <p className="font-medium">{selectedTask.equipment}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Priority</p>
                <p className={`font-medium ${getPriorityInfo(selectedTask.priority)?.textColor}`}>
                  {getPriorityInfo(selectedTask.priority)?.label}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500">Description</p>
              <p className="text-sm text-gray-700">{selectedTask.description}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Assign to Worker
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
