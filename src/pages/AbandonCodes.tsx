import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  FileText,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// ABN Codes Reference from FlowLogic documentation
const ABN_CODES = [
  { code: 'A', description: 'From Loc Empty', category: 'Location', severity: 'medium' },
  { code: 'B', description: 'Wrong Product in From Location', category: 'Product', severity: 'high' },
  { code: 'C', description: 'Wrong Product In To Location', category: 'Product', severity: 'high' },
  { code: 'D', description: 'No Room In To Location', category: 'Location', severity: 'medium' },
  { code: 'E', description: 'Incorrect Quantity', category: 'Quantity', severity: 'high' },
  { code: 'G', description: 'Damaged Pallet', category: 'Damage', severity: 'high' },
  { code: 'K', description: 'Get-Next: PreAssgn Eqpt Restr.', category: 'Equipment', severity: 'low' },
  { code: 'L', description: 'Get-Next: PreAssigned Traffic', category: 'Traffic', severity: 'low' },
  { code: 'M', description: 'Get-Next Data Error', category: 'System', severity: 'critical' },
  { code: 'N', description: 'End of Assignment Error', category: 'System', severity: 'medium' },
  { code: 'O', description: 'End Shift Error', category: 'Labor', severity: 'low' },
  { code: 'Q', description: 'Wrong License Plate Entered', category: 'Data Entry', severity: 'medium' },
  { code: 'T', description: 'At Location', category: 'Location', severity: 'low' },
  { code: 'Z', description: 'Miscellaneous-Driver Explain', category: 'Other', severity: 'medium' },
];

// Mock abandon events data
const mockAbandonEvents = [
  { id: 'ABN-001', code: 'A', timestamp: '2024-01-15 08:32:15', employee: 'John Smith', employeeId: 'EMP-1042', task: 'PICK-4521', location: 'A-12-03', notes: 'Location showed inventory but was empty' },
  { id: 'ABN-002', code: 'D', timestamp: '2024-01-15 09:15:42', employee: 'Maria Garcia', employeeId: 'EMP-1089', task: 'PUT-3321', location: 'B-05-02', notes: 'Bin full, needs consolidation' },
  { id: 'ABN-003', code: 'G', timestamp: '2024-01-15 09:45:00', employee: 'Robert Chen', employeeId: 'EMP-1056', task: 'REPL-221', location: 'C-08-01', notes: 'Pallet wrap torn, product falling' },
  { id: 'ABN-004', code: 'E', timestamp: '2024-01-15 10:12:33', employee: 'Sarah Johnson', employeeId: 'EMP-1023', task: 'PICK-4522', location: 'A-15-04', notes: 'System shows 24, only 18 on shelf' },
  { id: 'ABN-005', code: 'B', timestamp: '2024-01-15 10:45:18', employee: 'Mike Williams', employeeId: 'EMP-1078', task: 'PICK-4525', location: 'D-02-01', notes: 'SKU mismatch - wrong item in location' },
  { id: 'ABN-006', code: 'Q', timestamp: '2024-01-15 11:20:05', employee: 'John Smith', employeeId: 'EMP-1042', task: 'PUT-3325', location: 'A-10-02', notes: 'LP barcode damaged, manual entry failed' },
  { id: 'ABN-007', code: 'M', timestamp: '2024-01-15 11:55:42', employee: 'Lisa Brown', employeeId: 'EMP-1034', task: 'REPL-225', location: 'B-12-03', notes: 'System error on get-next' },
  { id: 'ABN-008', code: 'O', timestamp: '2024-01-15 14:00:00', employee: 'David Lee', employeeId: 'EMP-1067', task: 'PICK-4530', location: 'C-04-02', notes: 'Shift ending, task incomplete' },
];

// Analytics data
const abandonsByCode = ABN_CODES.map(abn => ({
  code: abn.code,
  description: abn.description,
  count: Math.floor(Math.random() * 50) + 5,
})).sort((a, b) => b.count - a.count);

const abandonTrend = [
  { date: 'Mon', count: 24, resolved: 22 },
  { date: 'Tue', count: 31, resolved: 28 },
  { date: 'Wed', count: 18, resolved: 18 },
  { date: 'Thu', count: 42, resolved: 35 },
  { date: 'Fri', count: 28, resolved: 26 },
  { date: 'Sat', count: 15, resolved: 15 },
  { date: 'Sun', count: 8, resolved: 8 },
];

const categoryBreakdown = [
  { name: 'Location', value: 35, color: '#3B82F6' },
  { name: 'Product', value: 25, color: '#EF4444' },
  { name: 'Quantity', value: 15, color: '#F59E0B' },
  { name: 'System', value: 12, color: '#8B5CF6' },
  { name: 'Equipment', value: 8, color: '#10B981' },
  { name: 'Other', value: 5, color: '#6B7280' },
];

export default function AbandonCodes() {
  const [activeTab, setActiveTab] = useState<'events' | 'codes' | 'analytics'>('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<typeof mockAbandonEvents[0] | null>(null);
  const [filterCode, setFilterCode] = useState<string>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCodeInfo = (code: string) => ABN_CODES.find(c => c.code === code);

  const filteredEvents = mockAbandonEvents.filter(event => {
    const matchesSearch =
      event.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.task.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCode === 'all' || event.code === filterCode;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abandon Codes (ABN)</h1>
          <p className="text-gray-500 mt-1">Track and analyze task abandonment reasons</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <AlertTriangle className="w-4 h-4" />
            Log Abandon
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
              <p className="text-sm text-gray-500">Today's Abandons</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-500" />
            <span className="text-green-600">12% less</span>
            <span className="text-gray-500">than yesterday</span>
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
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600">2.1% up</span>
            <span className="text-gray-500">this week</span>
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
              <p className="text-sm text-gray-500">Top Reason</p>
              <p className="text-2xl font-bold text-gray-900">Code A</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MapPin className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">From Loc Empty (32%)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900">18 min</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-500" />
            <span className="text-green-600">3 min faster</span>
            <span className="text-gray-500">than last week</span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Recent Events
              </div>
            </button>
            <button
              onClick={() => setActiveTab('codes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'codes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                ABN Code Reference
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events, employees, locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterCode}
                    onChange={(e) => setFilterCode(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Codes</option>
                    {ABN_CODES.map(code => (
                      <option key={code.code} value={code.code}>
                        {code.code} - {code.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Events Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEvents.map((event) => {
                      const codeInfo = getCodeInfo(event.code);
                      return (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.id}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getSeverityColor(codeInfo?.severity || 'medium')}`}>
                              {event.code} - {codeInfo?.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{event.timestamp}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{event.employee}</td>
                          <td className="px-4 py-3 text-sm font-mono text-blue-600">{event.task}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{event.location}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Codes Reference Tab */}
          {activeTab === 'codes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ABN_CODES.map((abn) => (
                <motion.div
                  key={abn.code}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{abn.code}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{abn.description}</h3>
                        <p className="text-sm text-gray-500">{abn.category}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(abn.severity)}`}>
                      {abn.severity}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">This week:</span>
                      <span className="font-medium text-gray-900">
                        {abandonsByCode.find(a => a.code === abn.code)?.count || 0} events
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Abandons by Code */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Abandons by Code (This Week)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={abandonsByCode.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="code" type="category" width={40} />
                      <Tooltip
                        formatter={(value) => [value, 'Count']}
                        labelFormatter={(label) => {
                          const code = abandonsByCode.find(a => a.code === label);
                          return code ? `${code.code}: ${code.description}` : label;
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Category Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Weekly Abandon Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={abandonTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2} name="Total Abandons" />
                    <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Abandon Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedEvent.id}</p>
                  <p className="text-sm text-gray-500">{selectedEvent.timestamp}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Abandon Code</p>
                  <p className="font-medium text-gray-900">
                    {selectedEvent.code} - {getCodeInfo(selectedEvent.code)?.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Category</p>
                  <p className="font-medium text-gray-900">{getCodeInfo(selectedEvent.code)?.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Employee</p>
                  <p className="font-medium text-gray-900">{selectedEvent.employee}</p>
                  <p className="text-sm text-gray-500">{selectedEvent.employeeId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Task</p>
                  <p className="font-mono text-blue-600">{selectedEvent.task}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Location</p>
                  <p className="font-mono text-gray-900">{selectedEvent.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Severity</p>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(getCodeInfo(selectedEvent.code)?.severity || 'medium')}`}>
                    {getCodeInfo(selectedEvent.code)?.severity}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedEvent.notes}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Resolve Issue
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Assign to Supervisor
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
