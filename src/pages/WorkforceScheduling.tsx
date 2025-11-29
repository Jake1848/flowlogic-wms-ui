import { useState } from 'react'
import {
  CalendarDays,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  Sunrise,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Employee {
  id: string
  name: string
  role: string
  department: 'receiving' | 'shipping' | 'picking' | 'inventory' | 'returns' | 'management'
  skills: string[]
  status: 'available' | 'scheduled' | 'off' | 'vacation' | 'sick'
}

interface Shift {
  id: string
  employeeId: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  department: string
  type: 'regular' | 'overtime' | 'on_call'
  status: 'scheduled' | 'in_progress' | 'completed' | 'no_show'
}

const mockEmployees: Employee[] = [
  { id: 'EMP001', name: 'John Smith', role: 'Forklift Operator', department: 'receiving', skills: ['forklift', 'hazmat'], status: 'scheduled' },
  { id: 'EMP002', name: 'Sarah Johnson', role: 'Picker', department: 'picking', skills: ['rf_scanner', 'voice_pick'], status: 'scheduled' },
  { id: 'EMP003', name: 'Mike Wilson', role: 'Shipping Lead', department: 'shipping', skills: ['leadership', 'hazmat', 'ltl'], status: 'scheduled' },
  { id: 'EMP004', name: 'Emily Davis', role: 'Inventory Specialist', department: 'inventory', skills: ['cycle_count', 'rf_scanner'], status: 'off' },
  { id: 'EMP005', name: 'Tom Brown', role: 'Returns Processor', department: 'returns', skills: ['qc_inspection', 'rf_scanner'], status: 'vacation' },
  { id: 'EMP006', name: 'Lisa Martinez', role: 'Receiver', department: 'receiving', skills: ['rf_scanner', 'putaway'], status: 'scheduled' },
  { id: 'EMP007', name: 'James Taylor', role: 'Packer', department: 'shipping', skills: ['packing', 'cartonization'], status: 'scheduled' },
  { id: 'EMP008', name: 'Amy Chen', role: 'QC Inspector', department: 'inventory', skills: ['qc_inspection', 'auditing'], status: 'sick' },
]

const mockShifts: Shift[] = [
  { id: 'SH001', employeeId: 'EMP001', employeeName: 'John Smith', date: '2024-01-23', startTime: '06:00', endTime: '14:30', department: 'Receiving', type: 'regular', status: 'scheduled' },
  { id: 'SH002', employeeId: 'EMP002', employeeName: 'Sarah Johnson', date: '2024-01-23', startTime: '06:00', endTime: '14:30', department: 'Picking', type: 'regular', status: 'in_progress' },
  { id: 'SH003', employeeId: 'EMP003', employeeName: 'Mike Wilson', date: '2024-01-23', startTime: '14:00', endTime: '22:30', department: 'Shipping', type: 'regular', status: 'scheduled' },
  { id: 'SH004', employeeId: 'EMP006', employeeName: 'Lisa Martinez', date: '2024-01-23', startTime: '06:00', endTime: '14:30', department: 'Receiving', type: 'regular', status: 'in_progress' },
  { id: 'SH005', employeeId: 'EMP007', employeeName: 'James Taylor', date: '2024-01-23', startTime: '14:00', endTime: '22:30', department: 'Shipping', type: 'overtime', status: 'scheduled' },
  { id: 'SH006', employeeId: 'EMP001', employeeName: 'John Smith', date: '2024-01-24', startTime: '06:00', endTime: '14:30', department: 'Receiving', type: 'regular', status: 'scheduled' },
  { id: 'SH007', employeeId: 'EMP002', employeeName: 'Sarah Johnson', date: '2024-01-24', startTime: '14:00', endTime: '22:30', department: 'Picking', type: 'regular', status: 'scheduled' },
]

const laborDemandData = [
  { hour: '6AM', required: 15, scheduled: 14 },
  { hour: '8AM', required: 25, scheduled: 24 },
  { hour: '10AM', required: 30, scheduled: 28 },
  { hour: '12PM', required: 25, scheduled: 25 },
  { hour: '2PM', required: 28, scheduled: 30 },
  { hour: '4PM', required: 32, scheduled: 30 },
  { hour: '6PM', required: 25, scheduled: 26 },
  { hour: '8PM', required: 18, scheduled: 18 },
]

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WorkforceScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'calendar' | 'roster' | 'coverage'>('calendar')
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')

  const getStatusBadge = (status: Employee['status']) => {
    const styles = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      off: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      vacation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      sick: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getShiftIcon = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0])
    if (hour >= 6 && hour < 14) return <Sunrise className="w-4 h-4 text-yellow-500" />
    if (hour >= 14 && hour < 22) return <Sun className="w-4 h-4 text-orange-500" />
    return <Moon className="w-4 h-4 text-blue-500" />
  }

  const generateWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = generateWeekDates()

  const stats = {
    totalScheduled: mockShifts.filter(s => s.date === '2024-01-23').length,
    available: mockEmployees.filter(e => e.status === 'available').length,
    onVacation: mockEmployees.filter(e => e.status === 'vacation').length,
    sick: mockEmployees.filter(e => e.status === 'sick').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workforce Scheduling</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employee schedules and labor coverage</p>
        </div>
        <div className="flex gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'day' | 'week')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="day">Day View</option>
            <option value="week">Week View</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Shifts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalScheduled}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Coffee className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On Vacation</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.onVacation}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sick</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.sick}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'calendar', label: 'Schedule Calendar' },
            { id: 'roster', label: 'Employee Roster' },
            { id: 'coverage', label: 'Coverage Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'calendar' | 'roster' | 'coverage')}
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

      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setDate(selectedDate.getDate() - 7)
                setSelectedDate(newDate)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setDate(selectedDate.getDate() + 7)
                setSelectedDate(newDate)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week View */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {weekDates.map((date, index) => (
              <div
                key={index}
                className={`p-3 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-700 ${
                  date.toDateString() === new Date().toDateString()
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <p className="text-sm text-gray-500">{weekDays[index]}</p>
                <p className={`text-lg font-semibold ${
                  date.toDateString() === new Date().toDateString()
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0]
              const dayShifts = mockShifts.filter(s => s.date === dateStr)
              return (
                <div
                  key={index}
                  className="p-2 border-r last:border-r-0 border-gray-200 dark:border-gray-700"
                >
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`mb-2 p-2 rounded-lg text-xs ${
                        shift.type === 'overtime'
                          ? 'bg-orange-100 dark:bg-orange-900/30 border-l-2 border-orange-500'
                          : 'bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {getShiftIcon(shift.startTime)}
                        <span className="font-medium truncate">{shift.employeeName}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {shift.startTime} - {shift.endTime}
                      </p>
                      <p className="text-gray-500">{shift.department}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Skills
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
              {mockEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{employee.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {employee.skills.slice(0, 2).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                        >
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                      {employee.skills.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          +{employee.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(employee.status)}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Labor Coverage Today</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={laborDemandData}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="required" fill="#EF4444" name="Required" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="scheduled" fill="#10B981" name="Scheduled" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
              </div>
            </div>
          </div>

          {/* Coverage Gaps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coverage Gaps</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Picking - 4PM to 6PM</p>
                    <p className="text-sm text-gray-500">2 additional pickers needed</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                  Fill Gap
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Receiving - Tomorrow 6AM</p>
                    <p className="text-sm text-gray-500">1 forklift operator needed</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm">
                  Fill Gap
                </button>
              </div>
            </div>
          </div>

          {/* Department Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Receiving', 'Picking', 'Shipping'].map((dept) => (
              <div key={dept} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{dept}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">First Shift</span>
                    <span className="text-green-600">4/4 staffed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Second Shift</span>
                    <span className="text-yellow-600">3/4 staffed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Third Shift</span>
                    <span className="text-gray-400">N/A</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
