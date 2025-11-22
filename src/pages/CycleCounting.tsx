import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Filter,
  Play,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  TrendingUp,
  RefreshCw,
  Download,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  { class: 'A', description: 'High value/velocity', countFrequency: 'Weekly', color: 'bg-red-100 text-red-800' },
  { class: 'B', description: 'Medium value/velocity', countFrequency: 'Monthly', color: 'bg-yellow-100 text-yellow-800' },
  { class: 'C', description: 'Low value/velocity', countFrequency: 'Quarterly', color: 'bg-green-100 text-green-800' },
];

// Mock cycle count tasks
const mockCountTasks = [
  {
    id: 'CC-2024-001',
    type: 'abc',
    zone: 'A',
    locations: ['A-12-01', 'A-12-02', 'A-12-03', 'A-12-04'],
    assignee: 'John Smith',
    status: 'in_progress',
    progress: 2,
    total: 4,
    scheduledDate: '2024-01-15',
    startTime: '08:30',
    variances: 1
  },
  {
    id: 'CC-2024-002',
    type: 'location',
    zone: 'B',
    locations: ['B-05-01', 'B-05-02', 'B-05-03', 'B-05-04', 'B-05-05', 'B-05-06'],
    assignee: 'Maria Garcia',
    status: 'pending',
    progress: 0,
    total: 6,
    scheduledDate: '2024-01-15',
    startTime: '09:00',
    variances: 0
  },
  {
    id: 'CC-2024-003',
    type: 'negative',
    zone: 'C',
    locations: ['C-08-04', 'C-10-02'],
    assignee: 'Robert Chen',
    status: 'completed',
    progress: 2,
    total: 2,
    scheduledDate: '2024-01-15',
    startTime: '07:00',
    variances: 2
  },
];

// Mock count results for detail view
const mockCountResults = [
  { location: 'A-12-01', sku: 'SKU-10045', description: 'Wireless Headphones', systemQty: 45, countedQty: 45, variance: 0, status: 'matched' },
  { location: 'A-12-02', sku: 'SKU-20089', description: 'USB-C Cable', systemQty: 120, countedQty: 118, variance: -2, status: 'variance' },
  { location: 'A-12-03', sku: 'SKU-30156', description: 'Laptop Stand', systemQty: 28, countedQty: null, variance: null, status: 'pending' },
  { location: 'A-12-04', sku: 'SKU-40221', description: 'Mechanical Keyboard', systemQty: 36, countedQty: null, variance: null, status: 'pending' },
];

// Accuracy trend data
const accuracyTrend = [
  { week: 'W1', accuracy: 96.2, counts: 145 },
  { week: 'W2', accuracy: 97.1, counts: 162 },
  { week: 'W3', accuracy: 95.8, counts: 138 },
  { week: 'W4', accuracy: 98.2, counts: 171 },
  { week: 'W5', accuracy: 97.5, counts: 155 },
  { week: 'W6', accuracy: 98.8, counts: 168 },
];

// Zone accuracy data
const zoneAccuracy = [
  { zone: 'Zone A', accuracy: 98.5, counts: 245 },
  { zone: 'Zone B', accuracy: 97.2, counts: 312 },
  { zone: 'Zone C', accuracy: 96.8, counts: 198 },
  { zone: 'Zone D', accuracy: 99.1, counts: 156 },
  { zone: 'Reserve', accuracy: 95.4, counts: 89 },
];

export default function CycleCounting() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedule' | 'analytics'>('tasks');
  const [selectedTask, setSelectedTask] = useState<typeof mockCountTasks[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number | null) => {
    if (variance === null) return 'text-gray-400';
    if (variance === 0) return 'text-green-600';
    return 'text-red-600';
  };

  const filteredTasks = mockCountTasks.filter(task =>
    filterStatus === 'all' || task.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cycle Counting</h1>
          <p className="text-gray-500 mt-1">Manage inventory counts and accuracy tracking</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Play className="w-4 h-4" />
            Generate Count
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Counts</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">18 completed, 6 pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inventory Accuracy</p>
              <p className="text-2xl font-bold text-green-600">98.2%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+0.5% vs last week</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Variances Found</p>
              <p className="text-2xl font-bold text-orange-600">12</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">8 resolved, 4 pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Locations Counted</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">This month</p>
        </motion.div>
      </div>

      {/* ABC Classification Reference */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-3">ABC Classification Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ABC_CLASSES.map((abc) => (
            <div key={abc.class} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${abc.color}`}>
                {abc.class}
              </div>
              <div>
                <p className="font-medium text-gray-900">{abc.description}</p>
                <p className="text-sm text-gray-500">Count: {abc.countFrequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Count Tasks
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Schedule
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTask?.id === task.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          task.status === 'completed' ? 'bg-green-100' :
                          task.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : task.status === 'in_progress' ? (
                            <RefreshCw className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{task.id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Zone {task.zone} • {task.locations.length} locations • {task.assignee}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{task.progress}/{task.total}</p>
                        <p className="text-sm text-gray-500">{task.scheduledDate}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(task.progress / task.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedTask?.id === task.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <h4 className="font-medium text-gray-900 mb-3">Count Results</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">System</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Counted</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Variance</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {mockCountResults.map((result, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-mono">{result.location}</td>
                                <td className="px-3 py-2">{result.sku}</td>
                                <td className="px-3 py-2 text-right">{result.systemQty}</td>
                                <td className="px-3 py-2 text-right">{result.countedQty ?? '-'}</td>
                                <td className={`px-3 py-2 text-right font-medium ${getVarianceColor(result.variance)}`}>
                                  {result.variance !== null ? (result.variance > 0 ? `+${result.variance}` : result.variance) : '-'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    result.status === 'matched' ? 'bg-green-100 text-green-800' :
                                    result.status === 'variance' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {result.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">January 2024</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div
                    key={day}
                    className={`p-2 text-center rounded-lg border ${
                      day === 15 ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {(day % 3 === 0 || day === 15) && (
                      <div className="mt-1">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Scheduled Count Types</h4>
                <div className="space-y-2">
                  {COUNT_TYPES.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Inventory Accuracy Trend</h3>
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Accuracy by Zone</h3>
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
