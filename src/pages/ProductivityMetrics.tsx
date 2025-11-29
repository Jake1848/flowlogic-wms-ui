import { useState } from 'react'
import {
  Users,
  Clock,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface EmployeeMetric {
  id: string
  name: string
  role: string
  department: string
  unitsPerHour: number
  accuracy: number
  hoursWorked: number
  trend: 'up' | 'down' | 'stable'
  rank: number
}

const mockEmployees: EmployeeMetric[] = [
  { id: 'EMP001', name: 'Sarah Johnson', role: 'Senior Picker', department: 'Picking', unitsPerHour: 145, accuracy: 99.8, hoursWorked: 38, trend: 'up', rank: 1 },
  { id: 'EMP002', name: 'Mike Wilson', role: 'Picker', department: 'Picking', unitsPerHour: 132, accuracy: 99.5, hoursWorked: 40, trend: 'up', rank: 2 },
  { id: 'EMP003', name: 'Lisa Chen', role: 'Packer', department: 'Packing', unitsPerHour: 85, accuracy: 99.9, hoursWorked: 36, trend: 'stable', rank: 3 },
  { id: 'EMP004', name: 'Tom Brown', role: 'Receiver', department: 'Receiving', unitsPerHour: 68, accuracy: 99.2, hoursWorked: 42, trend: 'down', rank: 4 },
  { id: 'EMP005', name: 'Amy Davis', role: 'Picker', department: 'Picking', unitsPerHour: 128, accuracy: 99.4, hoursWorked: 40, trend: 'up', rank: 5 },
  { id: 'EMP006', name: 'James Taylor', role: 'Forklift Operator', department: 'Receiving', unitsPerHour: 45, accuracy: 99.7, hoursWorked: 40, trend: 'stable', rank: 6 },
]

const hourlyProductivityData = [
  { hour: '6AM', picking: 95, packing: 75, receiving: 60 },
  { hour: '8AM', picking: 125, packing: 88, receiving: 72 },
  { hour: '10AM', picking: 142, packing: 95, receiving: 78 },
  { hour: '12PM', picking: 110, packing: 82, receiving: 65 },
  { hour: '2PM', picking: 138, packing: 92, receiving: 75 },
  { hour: '4PM', picking: 130, packing: 88, receiving: 70 },
  { hour: '6PM', picking: 115, packing: 80, receiving: 62 },
]

const weeklyTrendData = [
  { day: 'Mon', actual: 12500, target: 12000 },
  { day: 'Tue', actual: 13200, target: 12000 },
  { day: 'Wed', actual: 11800, target: 12000 },
  { day: 'Thu', actual: 14100, target: 12000 },
  { day: 'Fri', actual: 13500, target: 12000 },
]

export default function ProductivityMetrics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'trends'>('overview')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  const filteredEmployees = selectedDepartment === 'all'
    ? mockEmployees
    : mockEmployees.filter(e => e.department === selectedDepartment)

  const avgUnitsPerHour = Math.round(mockEmployees.reduce((sum, e) => sum + e.unitsPerHour, 0) / mockEmployees.length)
  const avgAccuracy = (mockEmployees.reduce((sum, e) => sum + e.accuracy, 0) / mockEmployees.length).toFixed(1)
  const totalHoursWorked = mockEmployees.reduce((sum, e) => sum + e.hoursWorked, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productivity Metrics</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor workforce productivity and efficiency</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Departments</option>
            <option value="Picking">Picking</option>
            <option value="Packing">Packing</option>
            <option value="Receiving">Receiving</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Calendar className="w-4 h-4" />
            This Week
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Units/Hour</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{avgUnitsPerHour}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</p>
              <p className="text-xl font-bold text-green-600">{avgAccuracy}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalHoursWorked}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Workers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{mockEmployees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'individual', label: 'Individual Performance' },
            { id: 'trends', label: 'Trends' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'individual' | 'trends')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Productivity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyProductivityData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="picking" stroke="#3B82F6" strokeWidth={2} name="Picking" />
                  <Line type="monotone" dataKey="packing" stroke="#10B981" strokeWidth={2} name="Packing" />
                  <Line type="monotone" dataKey="receiving" stroke="#F59E0B" strokeWidth={2} name="Receiving" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="target" fill="#E5E7EB" name="Target" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#3B82F6" name="Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockEmployees.slice(0, 3).map((employee, index) => (
                <div
                  key={employee.id}
                  className={`p-4 rounded-xl ${
                    index === 0
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400'
                      : index === 1
                      ? 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-300'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-400 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-400 text-white'
                        : 'bg-orange-400 text-orange-900'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Units/Hour</p>
                      <p className="font-bold text-gray-900 dark:text-white">{employee.unitsPerHour}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Accuracy</p>
                      <p className="font-bold text-green-600">{employee.accuracy}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Units/Hour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      employee.rank === 1
                        ? 'bg-yellow-100 text-yellow-800'
                        : employee.rank === 2
                        ? 'bg-gray-100 text-gray-800'
                        : employee.rank === 3
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {employee.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                    <div className="text-sm text-gray-500">{employee.role}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{employee.department}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{employee.unitsPerHour}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-green-600">{employee.accuracy}%</span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{employee.hoursWorked}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 ${
                      employee.trend === 'up' ? 'text-green-600' :
                      employee.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {employee.trend === 'up' ? <ArrowUp className="w-4 h-4" /> :
                       employee.trend === 'down' ? <ArrowDown className="w-4 h-4" /> : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Productivity Trend (6 Months)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: 'Aug', units: 108500, target: 100000 },
                  { month: 'Sep', units: 112000, target: 100000 },
                  { month: 'Oct', units: 115500, target: 105000 },
                  { month: 'Nov', units: 125000, target: 110000 },
                  { month: 'Dec', units: 142000, target: 120000 },
                  { month: 'Jan', units: 118000, target: 115000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="target" stroke="#9CA3AF" strokeDasharray="5 5" name="Target" />
                  <Line type="monotone" dataKey="units" stroke="#3B82F6" strokeWidth={2} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Best Day', value: 'Thursday', units: '14,100', change: '+17.5%' },
              { label: 'Avg Productivity', value: '13,020 units', units: 'per day', change: '+8.5%' },
              { label: 'Target Achievement', value: '108%', units: 'of weekly goal', change: '+3%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">{stat.units}</span>
                  <span className="text-sm text-green-600">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
