import { useState, useMemo } from 'react'
import { Users, Clock, TrendingUp, Award, BarChart3, Loader2, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useEmployeeList, useLaborSummary, useProductivityMetrics, type Employee } from '../hooks/useLabor'

// Fallback mock data when API is unavailable
const mockEmployees = [
  { id: '1', employeeNumber: 'EMP001', firstName: 'John', lastName: 'Doe', email: 'john@flowlogic.io', department: 'PICKING' as const, role: 'Picker', shift: 'DAY' as const, status: 'ACTIVE' as const, hireDate: '2023-01-15', skills: ['RF Scanner'], certifications: [] },
  { id: '2', employeeNumber: 'EMP002', firstName: 'Sarah', lastName: 'Miller', email: 'sarah@flowlogic.io', department: 'PICKING' as const, role: 'Picker', shift: 'DAY' as const, status: 'ACTIVE' as const, hireDate: '2023-03-20', skills: ['RF Scanner', 'Forklift'], certifications: [] },
  { id: '3', employeeNumber: 'EMP003', firstName: 'Mike', lastName: 'Roberts', email: 'mike@flowlogic.io', department: 'PACKING' as const, role: 'Packer', shift: 'DAY' as const, status: 'ACTIVE' as const, hireDate: '2023-02-10', skills: [], certifications: [] },
  { id: '4', employeeNumber: 'EMP004', firstName: 'Lisa', lastName: 'Kim', email: 'lisa@flowlogic.io', department: 'RECEIVING' as const, role: 'Receiver', shift: 'DAY' as const, status: 'ACTIVE' as const, hireDate: '2022-11-05', skills: [], certifications: [] },
  { id: '5', employeeNumber: 'EMP005', firstName: 'Tom', lastName: 'Brown', email: 'tom@flowlogic.io', department: 'SHIPPING' as const, role: 'Forklift Operator', shift: 'EVENING' as const, status: 'INACTIVE' as const, hireDate: '2023-05-01', skills: ['Forklift'], certifications: ['Forklift Certified'] },
]

export default function Labor() {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'tasks'>('overview')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')

  // Fetch data from API with fallback
  const { data: employeeData, isLoading: employeesLoading, error: employeesError } = useEmployeeList({ department: departmentFilter || undefined })
  const { data: summaryData, isLoading: summaryLoading } = useLaborSummary()
  const { data: productivityData, isLoading: productivityLoading } = useProductivityMetrics('TODAY', departmentFilter || undefined)

  const employees = employeeData?.data || mockEmployees
  const isLoading = employeesLoading || summaryLoading

  // Transform productivity data for chart
  const chartData = useMemo(() => {
    if (productivityData && productivityData.length > 0) {
      return productivityData.slice(0, 10).map(p => ({
        employee: p.employeeName.split(' ').map(n => n[0] + '.').join(' '),
        productivity: p.unitsPerHour,
        accuracy: p.accuracy,
      }))
    }
    // Fallback chart data
    return [
      { employee: 'Sarah M.', productivity: 105, accuracy: 99 },
      { employee: 'John D.', productivity: 98, accuracy: 97 },
      { employee: 'Lisa K.', productivity: 95, accuracy: 98 },
      { employee: 'Mike R.', productivity: 92, accuracy: 96 },
    ]
  }, [productivityData])

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'ON_LEAVE':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'INACTIVE':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getDepartmentColor = (department: Employee['department']) => {
    switch (department) {
      case 'PICKING':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'PACKING':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      case 'RECEIVING':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'SHIPPING':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'INVENTORY':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300'
      case 'MANAGEMENT':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  // Use summary data from API or calculate from employees
  const activeEmployees = summaryData?.clockedIn ?? employees.filter(e => e.status === 'ACTIVE').length
  const totalHoursToday = summaryData?.totalHoursToday ?? 0
  const avgProductivity = summaryData?.avgProductivity ?? 95
  const onBreak = summaryData?.onBreak ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Labor Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track employee performance, tasks, and productivity
          </p>
        </div>
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          >
            <option value="">All Departments</option>
            <option value="PICKING">Picking</option>
            <option value="PACKING">Packing</option>
            <option value="RECEIVING">Receiving</option>
            <option value="SHIPPING">Shipping</option>
            <option value="INVENTORY">Inventory</option>
            <option value="MANAGEMENT">Management</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading labor data...</span>
        </div>
      )}

      {/* Error state */}
      {employeesError && !isLoading && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Unable to load from server. Showing demo data.</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clocked In</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {activeEmployees}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">On Break</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {onBreak}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hours Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalHoursToday.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Productivity</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {avgProductivity.toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Team Overview
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Performance Metrics
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Task Assignment
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Team Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Skills
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{employee.employeeNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDepartmentColor(employee.department)}`}>
                          {employee.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {employee.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {employee.shift}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {employee.skills.length > 0 ? employee.skills.join(', ') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Performance Metrics Tab */}
          {activeTab === 'performance' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Employee Productivity Comparison
              </h3>
              {productivityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2">Loading metrics...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="employee" />
                    <YAxis domain={[0, 150]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="productivity" fill="#3b82f6" name="Units/Hour" />
                    <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Task Assignment Tab */}
          {activeTab === 'tasks' && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Task Assignment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Assign and manage tasks for warehouse employees
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
