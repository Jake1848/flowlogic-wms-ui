import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Play,
  CheckCircle,
  Clock,
  Package,
  Users,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// Wave statuses
const WAVE_STATUSES = [
  { id: 'planning', label: 'Planning', color: 'bg-gray-100 text-gray-800' },
  { id: 'released', label: 'Released', color: 'bg-blue-100 text-blue-800' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

// Wave types
const WAVE_TYPES = [
  { id: 'standard', label: 'Standard', description: 'Regular order fulfillment' },
  { id: 'priority', label: 'Priority', description: 'Rush and expedited orders' },
  { id: 'replenishment', label: 'Replenishment', description: 'Forward pick replenishment' },
  { id: 'bulk', label: 'Bulk', description: 'Large quantity orders' },
];

// Mock waves
const mockWaves = [
  {
    id: 'WAVE-001',
    name: 'Morning Standard',
    type: 'standard',
    status: 'in_progress',
    orders: 45,
    lines: 312,
    units: 1580,
    priority: 'normal',
    carrier: 'UPS Ground',
    cutoffTime: '12:00',
    startTime: '08:00',
    estimatedCompletion: '11:30',
    progress: { picked: 210, packed: 150, shipped: 85 },
    assignedPickers: 8,
    zone: 'A, B, C'
  },
  {
    id: 'WAVE-002',
    name: 'Priority Rush',
    type: 'priority',
    status: 'in_progress',
    orders: 12,
    lines: 48,
    units: 156,
    priority: 'high',
    carrier: 'FedEx Express',
    cutoffTime: '10:00',
    startTime: '07:30',
    estimatedCompletion: '09:45',
    progress: { picked: 38, packed: 32, shipped: 20 },
    assignedPickers: 3,
    zone: 'A'
  },
  {
    id: 'WAVE-003',
    name: 'Afternoon Bulk',
    type: 'bulk',
    status: 'planning',
    orders: 8,
    lines: 24,
    units: 2400,
    priority: 'normal',
    carrier: 'LTL Freight',
    cutoffTime: '16:00',
    startTime: null,
    estimatedCompletion: null,
    progress: { picked: 0, packed: 0, shipped: 0 },
    assignedPickers: 0,
    zone: 'D, E'
  },
  {
    id: 'WAVE-004',
    name: 'Replen Wave 1',
    type: 'replenishment',
    status: 'released',
    orders: 0,
    lines: 85,
    units: 1200,
    priority: 'normal',
    carrier: null,
    cutoffTime: '14:00',
    startTime: null,
    estimatedCompletion: '13:30',
    progress: { picked: 0, packed: 0, shipped: 0 },
    assignedPickers: 4,
    zone: 'A, B'
  },
  {
    id: 'WAVE-005',
    name: 'Yesterday Late',
    type: 'standard',
    status: 'completed',
    orders: 52,
    lines: 385,
    units: 1920,
    priority: 'normal',
    carrier: 'UPS Ground',
    cutoffTime: '17:00',
    startTime: '13:00',
    estimatedCompletion: '16:45',
    progress: { picked: 385, packed: 385, shipped: 385 },
    assignedPickers: 10,
    zone: 'A, B, C, D'
  },
];

// Progress chart data
const progressData = [
  { name: 'Picked', value: 248, color: '#3B82F6' },
  { name: 'Packed', value: 182, color: '#10B981' },
  { name: 'Shipped', value: 105, color: '#8B5CF6' },
  { name: 'Pending', value: 125, color: '#E5E7EB' },
];

// Hourly throughput
const hourlyThroughput = [
  { hour: '06:00', units: 0 },
  { hour: '07:00', units: 120 },
  { hour: '08:00', units: 280 },
  { hour: '09:00', units: 350 },
  { hour: '10:00', units: 420 },
  { hour: '11:00', units: 380 },
];

export default function WavePlanning() {
  const [activeTab, setActiveTab] = useState<'waves' | 'planning' | 'analytics'>('waves');
  const [selectedWave, setSelectedWave] = useState<typeof mockWaves[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusInfo = (statusId: string) => WAVE_STATUSES.find(s => s.id === statusId);
  const getTypeInfo = (typeId: string) => WAVE_TYPES.find(t => t.id === typeId);

  const filteredWaves = mockWaves.filter(wave =>
    filterStatus === 'all' || wave.status === filterStatus
  );

  const activeWaves = mockWaves.filter(w => w.status === 'in_progress' || w.status === 'released');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wave Planning</h1>
          <p className="text-gray-500 mt-1">Plan and manage picking waves for order fulfillment</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            Wave Rules
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Create Wave
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
              <p className="text-sm text-gray-500">Active Waves</p>
              <p className="text-2xl font-bold text-blue-600">{activeWaves.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layers className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Orders in Waves</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeWaves.reduce((sum, w) => sum + w.orders, 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-6 h-6 text-gray-600" />
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
              <p className="text-sm text-gray-500">Lines to Pick</p>
              <p className="text-2xl font-bold text-yellow-600">
                {activeWaves.reduce((sum, w) => sum + w.lines - w.progress.picked, 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
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
              <p className="text-sm text-gray-500">Assigned Pickers</p>
              <p className="text-2xl font-bold text-green-600">
                {activeWaves.reduce((sum, w) => sum + w.assignedPickers, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
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
              <p className="text-sm text-gray-500">Units/Hour</p>
              <p className="text-2xl font-bold text-purple-600">420</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="font-medium text-gray-900 mb-4">Today's Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={progressData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {progressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyThroughput}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="units" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('waves')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'waves'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Waves
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'planning'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Wave Planning
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
          {/* Waves Tab */}
          {activeTab === 'waves' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Status</option>
                  {WAVE_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Wave List */}
              <div className="space-y-3">
                {filteredWaves.map((wave) => {
                  const statusInfo = getStatusInfo(wave.status);
                  const typeInfo = getTypeInfo(wave.type);
                  const totalLines = wave.lines;
                  const pickedPct = totalLines > 0 ? (wave.progress.picked / totalLines) * 100 : 0;

                  return (
                    <motion.div
                      key={wave.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedWave?.id === wave.id
                          ? 'border-blue-300 bg-blue-50'
                          : wave.priority === 'high'
                          ? 'border-red-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWave(selectedWave?.id === wave.id ? null : wave)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            wave.status === 'in_progress' ? 'bg-yellow-100' :
                            wave.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {wave.status === 'in_progress' ? (
                              <Play className="w-5 h-5 text-yellow-600" />
                            ) : wave.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Layers className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{wave.id}</span>
                              <span className="text-gray-500">-</span>
                              <span className="text-gray-700">{wave.name}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo?.color}`}>
                                {statusInfo?.label}
                              </span>
                              {wave.priority === 'high' && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  PRIORITY
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {typeInfo?.label} • {wave.orders} orders • {wave.lines} lines • {wave.units.toLocaleString()} units
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {wave.carrier && (
                            <p className="text-sm font-medium">{wave.carrier}</p>
                          )}
                          <p className="text-sm text-gray-500">Cutoff: {wave.cutoffTime}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {wave.status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{Math.round(pickedPct)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${pickedPct}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Picked: {wave.progress.picked}</span>
                            <span>Packed: {wave.progress.packed}</span>
                            <span>Shipped: {wave.progress.shipped}</span>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {selectedWave?.id === wave.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Zones</p>
                              <p className="font-medium">{wave.zone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Pickers Assigned</p>
                              <p className="font-medium">{wave.assignedPickers}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Start Time</p>
                              <p className="font-medium">{wave.startTime || 'Not started'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Est. Completion</p>
                              <p className="font-medium">{wave.estimatedCompletion || 'TBD'}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {wave.status === 'planning' && (
                              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                Release Wave
                              </button>
                            )}
                            {wave.status === 'released' && (
                              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                                Start Wave
                              </button>
                            )}
                            {wave.status === 'in_progress' && (
                              <button className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                                Pause Wave
                              </button>
                            )}
                            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                              View Details
                            </button>
                            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                              Assign Pickers
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Planning Tab */}
          {activeTab === 'planning' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Wave Planning Assistant</h4>
                <p className="text-sm text-blue-700">
                  Configure wave parameters and let the system optimize order grouping based on zones, carriers, and priorities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Wave Configuration</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wave Type</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      {WAVE_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Filter</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="">All Carriers</option>
                      <option value="ups">UPS</option>
                      <option value="fedex">FedEx</option>
                      <option value="usps">USPS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone Selection</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['A', 'B', 'C', 'D', 'E'].map(zone => (
                        <button
                          key={zone}
                          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Available Orders</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Unassigned Orders</span>
                      <span className="font-bold text-lg">127</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Total Lines</span>
                      <span className="font-bold text-lg">892</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Units</span>
                      <span className="font-bold text-lg">4,521</span>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Generate Wave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Wave Analytics</h3>
              <p className="text-gray-500">Detailed wave performance metrics and historical data coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
